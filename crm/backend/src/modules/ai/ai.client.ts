import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import type { AppConfig } from '../../config/env.js';
import type { AppLogger } from '../../logger/index.js';
import { ExternalServiceError } from '../../errors/app.error.js';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCompletionOptions {
  system?: string;
  messages: AiMessage[];
  maxTokens?: number;
  /** Kind label for the audit log — e.g. "score_lead", "draft_followup". */
  kind: string;
  actorId?: string;
}

export interface AiCompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  modelId: string;
  durationMs: number;
}

export type AiProvider = 'anthropic' | 'openai' | 'gemini' | 'perplexity' | 'generic';

export interface AiProviderConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  maxTokens?: number;
  /** Per-request timeout in ms. Defaults to DEFAULT_REQUEST_TIMEOUT_MS; slower reasoning models may need more. */
  timeoutMs?: number;
}

// ── PII redaction ─────────────────────────────────────────────────────────────

interface PiiMap { [token: string]: string }

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function redactPii(text: string): { redacted: string; map: PiiMap } {
  const map: PiiMap = {};
  let counter = 0;
  let redacted = text;
  redacted = redacted.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, (m) => {
    const t = `[EMAIL_${++counter}]`; map[t] = m; return t;
  });
  // UUIDs (e.g. entity ids embedded in copilot references) contain long hyphenated digit runs that
  // the phone-number pattern below would otherwise misdetect — protect them first, then restore.
  const uuidMap: PiiMap = {};
  let uuidCounter = 0;
  redacted = redacted.replace(UUID_RE, (m) => {
    const t = `[UUID_${++uuidCounter}]`; uuidMap[t] = m; return t;
  });
  redacted = redacted.replace(/(?:\+?\d[\s\-.]?){10,}/g, (m) => {
    const t = `[PHONE_${++counter}]`; map[t] = m; return t;
  });
  for (const [token, value] of Object.entries(uuidMap)) {
    redacted = redacted.replaceAll(token, value);
  }
  return { redacted, map };
}

// ── Encryption helpers ────────────────────────────────────────────────────────

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32; // bytes for AES-256

/** Derives a 32-byte key from the encryption secret (pad/truncate). */
function deriveKey(secret: string): Buffer {
  return Buffer.from(secret.padEnd(KEY_LEN, '0').slice(0, KEY_LEN), 'utf8');
}

/** Encrypts plaintext → "iv:authTag:ciphertext" (all hex). */
export function encryptApiKey(plaintext: string, secret: string): string {
  if (!plaintext) return '';
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/** Decrypts "iv:authTag:ciphertext" → plaintext. Returns '' on failure. */
export function decryptApiKey(encrypted: string, secret: string): string {
  if (!encrypted) return '';
  try {
    const [ivHex, tagHex, ctHex] = encrypted.split(':');
    if (!ivHex || !tagHex || !ctHex) return '';
    const key = deriveKey(secret);
    const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return decipher.update(Buffer.from(ctHex, 'hex')).toString('utf8') + decipher.final('utf8');
  } catch {
    return '';
  }
}

/** Default per-request timeout when a config doesn't specify its own. Reasoning-heavy models may need a longer override. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

function isTimeoutError(err: unknown): boolean {
  return err instanceof Error && (err.name === 'TimeoutError' || err.name === 'APIConnectionTimeoutError');
}

/** Wraps a raw provider failure as a client-safe, properly-classified error carrying the real message. */
function toExternalServiceError(provider: string, err: unknown, timeoutMs: number): ExternalServiceError {
  const message = isTimeoutError(err)
    ? `The request to ${provider} timed out after ${timeoutMs / 1000}s.`
    : err instanceof Error ? err.message : 'The AI provider request failed.';
  return new ExternalServiceError(provider, message, { cause: err });
}

// ── Provider implementations ──────────────────────────────────────────────────

export interface AiClient {
  complete(options: AiCompletionOptions): Promise<AiCompletionResult>;
  isAvailable(): Promise<boolean>;
}

/** Calls the Anthropic Messages API using the native SDK. */
class AnthropicClient implements AiClient {
  private readonly client: Anthropic;

  constructor(
    private readonly cfg: AiProviderConfig,
    private readonly logger: AppLogger,
  ) {
    this.client = new Anthropic({
      apiKey: cfg.apiKey,
      maxRetries: 0, // our own loop below handles 429/529 retries with backoff
      ...(cfg.baseUrl ? { baseURL: cfg.baseUrl } : {}),
    });
  }

  async isAvailable() { return Boolean(this.cfg.apiKey); }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const start = Date.now();
    const messages = options.messages.map((m) => ({ role: m.role, content: redactPii(m.content).redacted }));
    const system = options.system ? redactPii(options.system).redacted : undefined;
    const timeoutMs = this.cfg.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

    const maxAttempts = 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await this.client.messages.create(
          {
            model: this.cfg.model,
            max_tokens: options.maxTokens ?? this.cfg.maxTokens ?? 2048,
            ...(system ? { system } : {}),
            messages,
          },
          { timeout: timeoutMs },
        );
        const text = res.content.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text).join('');
        this.logger.debug({ kind: options.kind, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, durationMs: Date.now() - start }, 'AI completion succeeded');
        return { text, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, modelId: res.model, durationMs: Date.now() - start };
      } catch (err) {
        lastError = err;
        const status = (err as { status?: number }).status;
        if (attempt < maxAttempts && (status === 429 || status === 529)) {
          const delay = 1000 * 2 ** (attempt - 1);
          this.logger.warn({ kind: options.kind, attempt, delay }, 'Anthropic throttled, retrying');
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        break;
      }
    }
    this.logger.error({ kind: options.kind, err: lastError }, 'Anthropic completion failed');
    throw toExternalServiceError('anthropic', lastError, timeoutMs);
  }
}

/**
 * OpenAI-compatible client used for: openai, gemini, perplexity, generic.
 * All these providers expose an OpenAI-compatible /chat/completions endpoint.
 */
class OpenAiCompatClient implements AiClient {
  private readonly baseUrl: string;

  constructor(
    private readonly cfg: AiProviderConfig,
    private readonly logger: AppLogger,
  ) {
    this.baseUrl = cfg.baseUrl ?? this.defaultBaseUrl(cfg.provider);
  }

  private defaultBaseUrl(provider: AiProvider): string {
    switch (provider) {
      case 'openai':      return 'https://api.openai.com/v1';
      case 'gemini':      return 'https://generativelanguage.googleapis.com/v1beta/openai';
      case 'perplexity':  return 'https://api.perplexity.ai';
      default:            return '';
    }
  }

  async isAvailable() { return Boolean(this.cfg.apiKey && this.baseUrl); }

  /** Some newer models (e.g. OpenAI's o-series/GPT-5+) reject `max_tokens` and require `max_completion_tokens` instead. */
  private tokenLimitParam: 'max_tokens' | 'max_completion_tokens' = 'max_tokens';

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const start = Date.now();
    const messages: { role: string; content: string }[] = [];
    if (options.system) messages.push({ role: 'system', content: redactPii(options.system).redacted });
    for (const m of options.messages) messages.push({ role: m.role, content: redactPii(m.content).redacted });

    const tokenLimit = options.maxTokens ?? this.cfg.maxTokens ?? 2048;
    const timeoutMs = this.cfg.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const maxAttempts = 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.cfg.apiKey}`,
          },
          body: JSON.stringify({
            model: this.cfg.model,
            [this.tokenLimitParam]: tokenLimit,
            messages,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          if (this.tokenLimitParam === 'max_tokens' && res.status === 400 && /max_completion_tokens/.test(body)) {
            this.tokenLimitParam = 'max_completion_tokens';
            continue;
          }
          const err = Object.assign(new Error(`HTTP ${res.status}: ${body}`), { status: res.status });
          if (attempt < maxAttempts && (res.status === 429 || res.status === 529)) {
            const delay = 1000 * 2 ** (attempt - 1);
            this.logger.warn({ kind: options.kind, attempt, delay, status: res.status }, `${this.cfg.provider} throttled, retrying`);
            await new Promise((r) => setTimeout(r, delay));
            lastError = err;
            continue;
          }
          throw err;
        }
        const json = await res.json() as {
          choices: Array<{ message: { content: string } }>;
          usage?: { prompt_tokens: number; completion_tokens: number };
          model?: string;
        };
        const text = json.choices[0]?.message.content ?? '';
        const inputTokens = json.usage?.prompt_tokens ?? 0;
        const outputTokens = json.usage?.completion_tokens ?? 0;
        const modelId = json.model ?? this.cfg.model;
        this.logger.debug({ kind: options.kind, inputTokens, outputTokens, durationMs: Date.now() - start }, 'AI completion succeeded');
        return { text, inputTokens, outputTokens, modelId, durationMs: Date.now() - start };
      } catch (err) {
        lastError = err;
        break;
      }
    }
    this.logger.error({ kind: options.kind, err: lastError }, `${this.cfg.provider} completion failed`);
    throw toExternalServiceError(this.cfg.provider, lastError, timeoutMs);
  }
}

/** Stub returned when no provider is configured. */
class UnconfiguredAiClient implements AiClient {
  async isAvailable() { return false; }
  async complete(_: AiCompletionOptions): Promise<AiCompletionResult> {
    throw new Error('AI is not configured. A Super Admin must set up an LLM provider in Settings → LLM.');
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function buildAiClient(cfg: AiProviderConfig | null, logger: AppLogger): AiClient {
  if (!cfg || !cfg.apiKey) return new UnconfiguredAiClient();
  if (cfg.provider === 'anthropic') return new AnthropicClient(cfg, logger);
  return new OpenAiCompatClient(cfg, logger);
}

/** Falls back to the .env ANTHROPIC_API_KEY when no DB config is active. */
export function createAiClient(config: AppConfig, logger: AppLogger): AiClient {
  if (config.ANTHROPIC_API_KEY) {
    return buildAiClient(
      { provider: 'anthropic', model: config.ANTHROPIC_MODEL, apiKey: config.ANTHROPIC_API_KEY, maxTokens: config.ANTHROPIC_MAX_TOKENS },
      logger,
    );
  }
  return new UnconfiguredAiClient();
}
