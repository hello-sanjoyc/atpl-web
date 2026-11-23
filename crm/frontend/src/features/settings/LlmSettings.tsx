import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CACHE_TTL, QUERY_KEYS } from '@aranax/contracts';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader } from '../../components/PageHeader';
import { Field, TextInput } from '../../components/form/fields';
import { useToast } from '../../components/Toast';

type Provider = 'anthropic' | 'openai' | 'gemini' | 'perplexity' | 'generic';

interface LlmConfig {
  id: string;
  label: string;
  provider: Provider;
  model: string;
  apiKeyHint: string;
  baseUrl: string | null;
  maxTokens: number;
  timeoutMs: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic:  'Anthropic (Claude)',
  openai:     'OpenAI (GPT)',
  gemini:     'Google Gemini',
  perplexity: 'Perplexity',
  generic:    'Generic / Self-hosted',
};

const PROVIDER_MODEL_PLACEHOLDER: Record<Provider, string> = {
  anthropic:  'e.g. claude-sonnet-4-6',
  openai:     'e.g. gpt-4o',
  gemini:     'e.g. gemini-1.5-pro',
  perplexity: 'e.g. llama-3.1-sonar-large-128k-online',
  generic:    'e.g. mistral-7b-instruct',
};

const PROVIDER_COLORS: Record<Provider, string> = {
  anthropic:  'bg-[#f97316]/10 text-[#f97316]',
  openai:     'bg-green-100 text-green-700',
  gemini:     'bg-blue-100 text-blue-700',
  perplexity: 'bg-purple-100 text-purple-700',
  generic:    'bg-gray-100 text-gray-600',
};

const PROVIDER_DOT_COLORS: Record<Provider, string> = {
  anthropic:  'bg-[#f97316]',
  openai:     'bg-green-600',
  gemini:     'bg-blue-600',
  perplexity: 'bg-purple-600',
  generic:    'bg-gray-500',
};

const EMPTY_FORM = { label: '', provider: 'anthropic' as Provider, model: '', apiKey: '', baseUrl: '', maxTokens: 2048, timeoutMs: 30_000, activate: false };

function Badge({ provider }: { provider: Provider }) {
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${PROVIDER_COLORS[provider]}`}>{PROVIDER_LABELS[provider]}</span>;
}

function useLlmConfigs() {
  return useQuery({
    queryKey: QUERY_KEYS.llmConfigs,
    queryFn: () => http.get<LlmConfig[]>(endpoints.settings.llm),
    staleTime: CACHE_TTL.reference.ms,
  });
}

export default function LlmSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: configs = [], isLoading } = useLlmConfigs();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function startCreate(provider: Provider) {
    setShowForm(true);
    setEditId(null);
    setForm({ ...EMPTY_FORM, provider });
    setMenuOpen(false);
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.llmConfigs });

  async function save() {
    if (!form.label || !form.model || (!editId && !form.apiKey)) return;
    setSaving(true);
    try {
      if (editId) {
        await http.patch(endpoints.settings.llmById(editId), {
          label: form.label, model: form.model,
          ...(form.apiKey ? { apiKey: form.apiKey } : {}),
          ...(form.baseUrl ? { baseUrl: form.baseUrl } : {}),
          maxTokens: form.maxTokens, timeoutMs: form.timeoutMs,
        });
        toast('LLM configuration updated', 'success');
      } else {
        await http.post(endpoints.settings.llm, {
          label: form.label, provider: form.provider, model: form.model, apiKey: form.apiKey,
          ...(form.baseUrl ? { baseUrl: form.baseUrl } : {}),
          maxTokens: form.maxTokens, timeoutMs: form.timeoutMs, activate: form.activate,
        });
        toast('LLM provider added', 'success');
      }
      await invalidate();
      setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function activate(id: string) {
    setActivatingId(id);
    try {
      await http.post(endpoints.settings.llmActivate(id), {});
      toast('Provider activated', 'success');
      await invalidate();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Activate failed', 'error');
    } finally {
      setActivatingId(null);
    }
  }

  async function testConn(id: string) {
    setTestingId(id);
    try {
      const d = await http.post<{ ok: boolean; reply: string; modelId: string; durationMs: number }>(endpoints.settings.llmTest(id), {});
      setTestResult((prev) => ({ ...prev, [id]: { ok: true, msg: `✓ ${d.reply} · ${d.modelId} · ${d.durationMs}ms` } }));
    } catch (e) {
      setTestResult((prev) => ({ ...prev, [id]: { ok: false, msg: e instanceof Error ? e.message : 'Test failed' } }));
    } finally {
      setTestingId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this LLM configuration?')) return;
    try {
      await http.delete(endpoints.settings.llmById(id));
      toast('LLM configuration deleted', 'success');
      await invalidate();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error');
    }
  }

  function startEdit(c: LlmConfig) {
    setEditId(c.id);
    setForm({ label: c.label, provider: c.provider, model: c.model, apiKey: '', baseUrl: c.baseUrl ?? '', maxTokens: c.maxTokens, timeoutMs: c.timeoutMs, activate: false });
    setShowForm(true);
  }

  return (
    <AppShell>
      <PageHeader
        title="LLM Configuration"
        subtitle="Switch provider, model or API key — changes take effect within 60 seconds."
        action={
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#f86223] text-white rounded-full text-[13px] font-bold hover:bg-[#d94f15] active:scale-[.99] transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Provider
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,.12)] border border-[#e2e6f0] py-2 z-20">
                  {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => startCreate(p)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#0f1117] hover:bg-[#f7f9fd] transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full ${PROVIDER_DOT_COLORS[p]}`} />
                      {PROVIDER_LABELS[p]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        }
      />

      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-[#6b7280] text-sm">Loading…</div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {configs.length === 0 && (
              <div className="bg-white rounded-[20px] p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,.06)]">
                <p className="text-[#9ca3af] text-sm">No LLM providers configured yet. Add one to enable AI features.</p>
              </div>
            )}
            {configs.map((c) => (
              <div key={c.id} className={`bg-white rounded-[20px] p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)] border-2 transition-all ${c.isActive ? 'border-[#00308a]' : 'border-transparent'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-[#0f1117]">{c.label}</span>
                      <Badge provider={c.provider} />
                      {c.isActive && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#00308a] text-white">ACTIVE</span>}
                    </div>
                    <p className="text-sm text-[#6b7280]">Model: <span className="font-mono text-[#0f1117]">{c.model}</span></p>
                    <p className="text-xs text-[#9ca3af] mt-0.5">API key: {c.apiKeyHint} · Max tokens: {c.maxTokens} · Timeout: {(c.timeoutMs / 1000).toFixed(0)}s</p>
                    {c.baseUrl && <p className="text-xs text-[#9ca3af]">Base URL: {c.baseUrl}</p>}
                    {testResult[c.id] && (
                      <p className={`text-xs mt-1 font-semibold ${testResult[c.id]!.ok ? 'text-green-600' : 'text-red-500'}`}>{testResult[c.id]!.msg}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    {!c.isActive && (
                      <button onClick={() => activate(c.id)} disabled={activatingId === c.id} className="text-xs px-3 py-1.5 rounded-full border border-[#00308a] text-[#00308a] font-semibold hover:bg-[#f0f4ff] disabled:opacity-50 transition-all">
                        {activatingId === c.id ? 'Activating…' : 'Activate'}
                      </button>
                    )}
                    <button onClick={() => testConn(c.id)} disabled={testingId === c.id} className="text-xs px-3 py-1.5 rounded-full border border-[#e2e6f0] text-[#6b7280] hover:border-[#00308a] hover:text-[#00308a] transition-all disabled:opacity-50">
                      {testingId === c.id ? 'Testing…' : 'Test'}
                    </button>
                    <button onClick={() => startEdit(c)} className="text-xs px-3 py-1.5 rounded-full border border-[#e2e6f0] text-[#6b7280] hover:border-[#0f1117] hover:text-[#0f1117] transition-all">Edit</button>
                    <button onClick={() => remove(c.id)} className="text-xs px-3 py-1.5 rounded-full border border-red-100 text-red-400 hover:border-red-400 hover:text-red-600 transition-all">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit form */}
        {showForm && (
          <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,.08),0_1px_4px_rgba(0,0,0,.04)]">
            <div className="flex items-center gap-2 mb-5">
              <h2 className="font-serif text-[18px] font-medium text-[#0f1117]">{editId ? 'Edit provider' : 'Add provider'}</h2>
              <Badge provider={form.provider} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Label" htmlFor="llm-label" required>
                <TextInput
                  id="llm-label"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Claude Sonnet (prod)"
                />
              </Field>
              <Field label="Model ID" htmlFor="llm-model" required>
                <TextInput
                  id="llm-model"
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  placeholder={PROVIDER_MODEL_PLACEHOLDER[form.provider]}
                />
              </Field>
              <Field
                label={editId ? 'New API Key' : 'API Key'}
                htmlFor="llm-api-key"
                required={!editId}
                hint={editId ? 'Leave blank to keep the current key' : undefined}
              >
                <TextInput
                  id="llm-api-key"
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                  placeholder={editId ? '(unchanged)' : 'sk-…'}
                />
              </Field>
              {(form.provider === 'generic' || form.provider === 'perplexity') && (
                <Field label="Base URL" htmlFor="llm-base-url" className="sm:col-span-2">
                  <TextInput
                    id="llm-base-url"
                    value={form.baseUrl}
                    onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                    placeholder="https://api.example.com/v1"
                  />
                </Field>
              )}
              <Field label="Max tokens" htmlFor="llm-max-tokens">
                <TextInput
                  id="llm-max-tokens"
                  type="number"
                  value={form.maxTokens}
                  onChange={(e) => setForm((f) => ({ ...f, maxTokens: Number(e.target.value) }))}
                  min={100}
                  max={32768}
                />
              </Field>
              <Field label="Timeout (seconds)" htmlFor="llm-timeout" hint="Slower reasoning models may need more time">
                <TextInput
                  id="llm-timeout"
                  type="number"
                  value={form.timeoutMs / 1000}
                  onChange={(e) => setForm((f) => ({ ...f, timeoutMs: Math.round(Number(e.target.value) * 1000) }))}
                  min={5}
                  max={600}
                />
              </Field>
              {!editId && (
                <div className="flex items-center gap-2 mt-7">
                  <input id="activate-chk" type="checkbox" checked={form.activate} onChange={(e) => setForm((f) => ({ ...f, activate: e.target.checked }))} className="w-4 h-4 rounded accent-[#f86223]" />
                  <label htmlFor="activate-chk" className="text-sm text-[#6b7280]">Set as active provider immediately</label>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => void save()}
                disabled={saving || !form.label || !form.model || (!editId && !form.apiKey)}
                className="px-6 py-3 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (editId ? 'Saving…' : 'Creating…') : editId ? 'Save changes' : 'Add provider'}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-6 py-3 rounded-full text-sm font-semibold text-[#6b7280] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="mt-6 p-4 rounded-[16px] bg-[#f0f4ff] border border-[#dbe4ff]">
          <p className="text-xs text-[#6b7280] leading-relaxed">
            <span className="font-semibold text-[#00308a]">How it works:</span> The active provider is used for all AI features. Changes take effect within 60 seconds (cached). The API key is stored AES-256-GCM encrypted and never returned in full — only the first and last 4 characters are shown. The fallback is the <code className="font-mono bg-white/60 px-1 rounded">ANTHROPIC_API_KEY</code> in <code className="font-mono bg-white/60 px-1 rounded">.env</code>.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
