import { and, desc, eq } from 'drizzle-orm';
import type { Container } from '../../container.js';
import type { AuthUser } from '../../types/fastify.js';
import { llmProviderConfigs } from '../../db/schema/ai.js';
import { buildAiClient, decryptApiKey, encryptApiKey, type AiProvider, type AiProviderConfig } from './ai.client.js';
import { NotFoundError, ValidationError } from '../../errors/app.error.js';

export interface LlmConfigRow {
  id: string;
  label: string;
  provider: AiProvider;
  model: string;
  /** API key is never returned to the client — only a masked hint. */
  apiKeyHint: string;
  baseUrl: string | null;
  maxTokens: number;
  timeoutMs: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLlmConfigInput {
  label: string;
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  maxTokens?: number;
  timeoutMs?: number;
  activate?: boolean;
}

export interface UpdateLlmConfigInput {
  label?: string;
  model?: string;
  /** Pass a non-empty string to rotate the key; omit / pass '' to leave unchanged. */
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  timeoutMs?: number;
}

function maskKey(encrypted: string, secret: string): string {
  const plain = decryptApiKey(encrypted, secret);
  if (!plain) return '(not set)';
  return plain.slice(0, 4) + '…' + plain.slice(-4);
}

function toRow(r: typeof llmProviderConfigs.$inferSelect, secret: string): LlmConfigRow {
  return {
    id: r.id,
    label: r.label,
    provider: r.provider as AiProvider,
    model: r.model,
    apiKeyHint: maskKey(r.apiKeyEncrypted, secret),
    baseUrl: r.baseUrl ?? null,
    maxTokens: r.maxTokens,
    timeoutMs: r.timeoutMs,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

import { withCache } from '../../cache/cache.service.js';
import { CACHE_KEYS, CACHE_TTL } from '@aranax/contracts';

export function createLlmConfigService(deps: Container) {
  const { db, cache, config, logger } = deps;
  const log = logger.child({ module: 'llm-config' });
  const encSecret = config.LLM_ENCRYPTION_SECRET;

  return {
    async list(): Promise<LlmConfigRow[]> {
      return withCache(cache, CACHE_KEYS.llmConfigs, CACHE_TTL.reference.seconds, async () => {
        const rows = await db.select().from(llmProviderConfigs).orderBy(desc(llmProviderConfigs.createdAt));
        return rows.map((r) => toRow(r, encSecret));
      });
    },

    async getById(id: string): Promise<LlmConfigRow | null> {
      const [row] = await db.select().from(llmProviderConfigs).where(eq(llmProviderConfigs.id, id));
      return row ? toRow(row, encSecret) : null;
    },

    async create(actor: AuthUser, input: CreateLlmConfigInput): Promise<LlmConfigRow> {
      const apiKeyEncrypted = encryptApiKey(input.apiKey, encSecret);
      const [row] = await db.transaction(async (tx) => {
        if (input.activate) {
          await tx.update(llmProviderConfigs).set({ isActive: false });
        }
        return tx
          .insert(llmProviderConfigs)
          .values({
            label: input.label,
            provider: input.provider,
            model: input.model,
            apiKeyEncrypted,
            baseUrl: input.baseUrl ?? null,
            maxTokens: input.maxTokens ?? 2048,
            timeoutMs: input.timeoutMs ?? 30_000,
            isActive: input.activate ?? false,
            createdBy: actor.id,
            updatedBy: actor.id,
          })
          .returning();
      });
      log.info({ id: row!.id, provider: row!.provider, actor: actor.id }, 'LLM config created');
      await cache.del(CACHE_KEYS.llmConfigs);
      return toRow(row!, encSecret);
    },

    async update(actor: AuthUser, id: string, input: UpdateLlmConfigInput): Promise<LlmConfigRow> {
      const existing = await db.select().from(llmProviderConfigs).where(eq(llmProviderConfigs.id, id));
      if (!existing[0]) throw Object.assign(new Error('LLM config not found'), { statusCode: 404 });

      const patch: Partial<typeof llmProviderConfigs.$inferInsert> = { updatedBy: actor.id };
      if (input.label !== undefined) patch.label = input.label;
      if (input.model !== undefined) patch.model = input.model;
      if (input.apiKey) patch.apiKeyEncrypted = encryptApiKey(input.apiKey, encSecret);
      if (input.baseUrl !== undefined) patch.baseUrl = input.baseUrl;
      if (input.maxTokens !== undefined) patch.maxTokens = input.maxTokens;
      if (input.timeoutMs !== undefined) patch.timeoutMs = input.timeoutMs;

      const [row] = await db.update(llmProviderConfigs).set(patch).where(eq(llmProviderConfigs.id, id)).returning();
      log.info({ id, actor: actor.id }, 'LLM config updated');
      await cache.del(CACHE_KEYS.llmConfigs);
      return toRow(row!, encSecret);
    },

    async activate(actor: AuthUser, id: string): Promise<LlmConfigRow> {
      const existing = await db.select().from(llmProviderConfigs).where(eq(llmProviderConfigs.id, id));
      if (!existing[0]) throw Object.assign(new Error('LLM config not found'), { statusCode: 404 });

      const [row] = await db.transaction(async (tx) => {
        await tx.update(llmProviderConfigs).set({ isActive: false });
        return tx.update(llmProviderConfigs).set({ isActive: true, updatedBy: actor.id }).where(eq(llmProviderConfigs.id, id)).returning();
      });
      log.info({ id, actor: actor.id }, 'LLM config activated');
      await cache.del(CACHE_KEYS.llmConfigs);
      return toRow(row!, encSecret);
    },

    async delete(actor: AuthUser, id: string): Promise<void> {
      await db.delete(llmProviderConfigs).where(and(eq(llmProviderConfigs.id, id)));
      log.info({ id, actor: actor.id }, 'LLM config deleted');
      await cache.del(CACHE_KEYS.llmConfigs);
    },

    /** Loads the active config and builds a live AiClient. Returns null-equivalent stub if none active. */
    async loadActiveClient() {
      const [row] = await db.select().from(llmProviderConfigs).where(eq(llmProviderConfigs.isActive, true));
      if (!row) return null;
      const cfg: AiProviderConfig = {
        provider: row.provider as AiProvider,
        model: row.model,
        apiKey: decryptApiKey(row.apiKeyEncrypted, encSecret),
        baseUrl: row.baseUrl ?? undefined,
        maxTokens: row.maxTokens,
        timeoutMs: row.timeoutMs,
      };
      return buildAiClient(cfg, logger.child({ module: 'ai' }));
    },

    async testConnection(id: string) {
      const [row] = await db.select().from(llmProviderConfigs).where(eq(llmProviderConfigs.id, id));
      if (!row) throw new NotFoundError(undefined, 'LLM config not found');
      const cfg: AiProviderConfig = {
        provider: row.provider as AiProvider,
        model: row.model,
        apiKey: decryptApiKey(row.apiKeyEncrypted, encSecret),
        baseUrl: row.baseUrl ?? undefined,
        maxTokens: row.maxTokens,
        timeoutMs: row.timeoutMs,
      };
      const client = buildAiClient(cfg, logger.child({ module: 'ai' }));
      if (!(await client.isAvailable())) throw new ValidationError('API key is missing or invalid.');
      const result = await client.complete({
        kind: 'connection_test',
        messages: [{ role: 'user', content: 'Reply with one word: OK' }],
        maxTokens: 10,
      });
      return { ok: true, reply: result.text.trim(), modelId: result.modelId, durationMs: result.durationMs };
    },
  };
}
