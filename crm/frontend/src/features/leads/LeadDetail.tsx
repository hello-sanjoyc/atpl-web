import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { Spinner } from '../../components/Spinner';
import { ErrorState } from '../../components/ErrorState';
import { Badge } from '../../components/Badge';
import { useResourceDetail, useResourceList, useResourceMutation } from '../_shared/hooks';
import { useOptions } from '../_shared/useOptions';
import { SelectInput, TextArea, enumOptions, humanize } from '../../components/form/fields';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { formatDate, formatDateTime } from '../../lib/format';
import type { Lead, LeadActivity } from '../_shared/types';
import { LEAD_STAGES } from '@aranax/contracts';

const stageOptions = enumOptions(LEAD_STAGES.map((s) => s.key));

interface ScoreExplain {
  leadId: string;
  deterministicScore: number;
  aiScore: number | null;
  aiScoreReason: string | null;
  aiAvailable: boolean;
  refreshing: boolean;
}

interface ConversationExtract {
  id: string;
  kind: string;
  summary: string | null;
  requirements: string[] | null;
  objections: string[] | null;
  commitments: string[] | null;
  actionItems: string[] | null;
  processedAt: string | null;
  createdAt: string;
}

interface AssigneeSuggestion {
  userId: string;
  displayName: string;
  email: string;
  score: number;
  reasons: string[];
  currentLoad: number;
  winRate: number;
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { labelFor } = useOptions();
  const lead = useResourceDetail<Lead>(['leads', id], id ? endpoints.leads.byId(id) : null);
  const activities = useResourceList<LeadActivity>(
    ['leads', id, 'activities'],
    id ? endpoints.leads.activities(id) : '',
  );
  const scoreExplain = useResourceDetail<ScoreExplain>(
    ['leads', id, 'score-explain'],
    id ? endpoints.leads.scoreExplain(id) : null,
  );
  const conversations = useResourceList<ConversationExtract>(
    ['leads', id, 'conversations'],
    id ? endpoints.leads.conversations(id) : '',
  );
  const assigneeSuggestions = useResourceList<AssigneeSuggestion>(
    ['leads', id, 'suggest-assignee'],
    id ? endpoints.leads.suggestAssignee(id) : '',
  );

  const [note, setNote] = useState('');
  const [stage, setStage] = useState('');
  const [conversationText, setConversationText] = useState('');
  const [conversationKind, setConversationKind] = useState<'transcript' | 'meeting_notes' | 'email_thread'>('transcript');
  const [followUpDraft, setFollowUpDraft] = useState<string | null>(null);
  const [followUpChannel, setFollowUpChannel] = useState<'email' | 'whatsapp'>('email');

  const stageMutation = useResourceMutation(
    (newStage: string) => http.patch(endpoints.leads.stage(id!), { stage: newStage }),
    { invalidate: ['leads', id], successMessage: 'Stage updated' },
  );
  const noteMutation = useResourceMutation(
    (body: string) => http.post(endpoints.leads.activities(id!), { type: 'note', body }),
    { invalidate: ['leads', id, 'activities'], successMessage: 'Note added', onSuccess: () => setNote('') },
  );
  const conversationMutation = useResourceMutation(
    (payload: { rawText: string; kind: string }) =>
      http.post(endpoints.leads.conversations(id!), payload),
    {
      invalidate: ['leads', id, 'conversations'],
      successMessage: 'Conversation submitted for processing',
      onSuccess: () => setConversationText(''),
    },
  );
  const followUpMutation = useResourceMutation(
    (channel: string) =>
      http.post(endpoints.leads.followUpDraft(id!), { channel }).then((r) => {
        setFollowUpDraft(((r as { data: { draft: string } }).data?.draft) ?? null);
        return r;
      }),
    { successMessage: 'Draft generated' },
  );

  if (lead.isLoading) return <AppShell><Spinner /></AppShell>;
  if (lead.error) return <AppShell><ErrorState error={lead.error} /></AppShell>;
  const l = lead.data!;

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4 pt-4 text-[13px] text-[#6b7280]">
        <Link to="/leads" className="font-medium hover:text-[#0f1117] transition-colors">Leads</Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-[#0f1117] truncate">{l.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-serif text-[32px] font-medium tracking-tight text-[#0f1117] leading-tight">{l.name}</h1>
          <p className="text-sm text-[#6b7280] mt-1">{l.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge value={l.stage} />
          <Badge value={l.priority} />
          <Badge value={l.qualificationStatus} />
          {l.duplicateGroupId && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">Duplicate</span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Main column */}
        <div className="flex flex-col gap-5">
          {/* Details */}
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Details</h2>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Detail label="Company" value={l.company} />
              <Detail label="Phone" value={l.phone} />
              <Detail label="Country" value={l.country} />
              <Detail label="Capture channel" value={labelFor('capture_channel', l.captureChannel)} />
              <Detail label="Lead source" value={labelFor('lead_source', l.leadSource)} />
              <Detail label="Service interest" value={labelFor('service_interest', l.serviceInterest)} />
              <Detail label="Budget" value={labelFor('budget_range', l.budgetRange)} />
              <Detail label="Timeline" value={l.timeline && humanize(l.timeline)} />
              <Detail label="Score" value={l.score != null ? String(l.score) : null} />
              <Detail label="Created" value={formatDate(l.createdAt)} />
            </dl>
            {l.message && (
              <div className="mt-5 pt-5 border-t border-[#eef1f7]">
                <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">Message</dt>
                <p className="text-sm text-[#0f1117] whitespace-pre-wrap">{l.message}</p>
              </div>
            )}
          </section>

          {/* AI Score Panel */}
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">AI Score Intelligence</h2>
            {scoreExplain.isLoading ? (
              <Spinner />
            ) : scoreExplain.data ? (
              <div className="flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <ScoreMeter label="Deterministic Score" score={scoreExplain.data.deterministicScore} color="#00308a" />
                  {scoreExplain.data.aiAvailable ? (
                    scoreExplain.data.aiScore !== null ? (
                      <ScoreMeter label="AI Score" score={scoreExplain.data.aiScore} color="#f86223" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-[#f9fafb] text-center">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">AI Score</p>
                        <p className="text-sm text-[#9ca3af]">
                          {scoreExplain.data.refreshing ? 'Computing…' : 'Not yet scored'}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-[#f9fafb] text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">AI Score</p>
                      <p className="text-sm text-[#9ca3af]">AI not configured</p>
                    </div>
                  )}
                </div>
                {scoreExplain.data.aiScoreReason && (
                  <div className="p-4 rounded-2xl bg-[#f0f4ff]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">AI Reasoning</p>
                    <p className="text-sm text-[#0f1117]">{scoreExplain.data.aiScoreReason}</p>
                  </div>
                )}
                {l.aiSummary && (
                  <div className="p-4 rounded-2xl bg-[#f9fafb]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">AI Summary</p>
                    <p className="text-sm text-[#0f1117]">{l.aiSummary}</p>
                  </div>
                )}
              </div>
            ) : null}
          </section>

          {/* Conversation Intelligence */}
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Conversation Intelligence</h2>

            {/* Upload form */}
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex gap-2">
                {(['transcript', 'meeting_notes', 'email_thread'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setConversationKind(k)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                      conversationKind === k
                        ? 'bg-[#00308a] text-white'
                        : 'bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0]'
                    }`}
                  >
                    {humanize(k)}
                  </button>
                ))}
              </div>
              <TextArea
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                placeholder="Paste transcript, meeting notes or email thread…"
                className="min-h-[96px]"
              />
              <button
                onClick={() =>
                  conversationText.trim() &&
                  conversationMutation.mutate({ rawText: conversationText.trim(), kind: conversationKind })
                }
                disabled={!conversationText.trim() || conversationMutation.isPending}
                className="self-start px-4 py-2 rounded-full bg-[#f86223] text-white text-[13px] font-bold hover:bg-[#d94f15] disabled:opacity-50 transition-all"
              >
                {conversationMutation.isPending ? 'Processing…' : 'Extract insights'}
              </button>
            </div>

            {/* Extracted conversations */}
            {conversations.isLoading ? (
              <Spinner />
            ) : conversations.data?.items && conversations.data.items.length > 0 ? (
              <div className="flex flex-col gap-4">
                {conversations.data.items.map((conv) => (
                  <div key={conv.id} className="border border-[#eef1f7] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge value={conv.kind} />
                      <span className="text-xs text-[#9ca3af]">{formatDateTime(conv.createdAt)}</span>
                    </div>
                    {conv.summary && <p className="text-sm text-[#0f1117] mb-3">{conv.summary}</p>}
                    {conv.processedAt ? (
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <ConvList label="Requirements" items={conv.requirements} />
                        <ConvList label="Objections" items={conv.objections} />
                        <ConvList label="Commitments" items={conv.commitments} />
                        <ConvList label="Action Items" items={conv.actionItems} />
                      </div>
                    ) : (
                      <p className="text-xs text-[#9ca3af]">Processing…</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9ca3af]">No conversations yet.</p>
            )}
          </section>

          {/* AI Follow-up Draft */}
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">AI Follow-up Draft</h2>
            <div className="flex gap-2 mb-3">
              {(['email', 'whatsapp'] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setFollowUpChannel(ch)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                    followUpChannel === ch
                      ? 'bg-[#00308a] text-white'
                      : 'bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0]'
                  }`}
                >
                  {ch === 'email' ? 'Email' : 'WhatsApp'}
                </button>
              ))}
            </div>
            <button
              onClick={() => followUpMutation.mutate(followUpChannel)}
              disabled={followUpMutation.isPending}
              className="px-4 py-2 rounded-full bg-[#f86223] text-white text-[13px] font-bold hover:bg-[#d94f15] disabled:opacity-50 transition-all mb-4"
            >
              {followUpMutation.isPending ? 'Generating…' : 'Generate draft'}
            </button>
            {followUpDraft && (
              <div className="p-4 rounded-2xl bg-[#f9fafb]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-2">Draft</p>
                <pre className="text-sm text-[#0f1117] whitespace-pre-wrap font-sans">{followUpDraft}</pre>
              </div>
            )}
          </section>

          {/* Activities */}
          <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-4">Activity</h2>
            <div className="flex flex-col gap-2 mb-4">
              <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="min-h-[72px]" />
              <button
                onClick={() => note.trim() && noteMutation.mutate(note.trim())}
                disabled={!note.trim() || noteMutation.isPending}
                className="self-start px-4 py-2 rounded-full bg-[#f86223] text-white text-[13px] font-bold hover:bg-[#d94f15] disabled:opacity-50 transition-all"
              >
                Add note
              </button>
            </div>
            {activities.isLoading ? (
              <Spinner />
            ) : activities.data && activities.data.items.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {activities.data.items.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <Badge value={a.type} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[#0f1117] whitespace-pre-wrap">{a.body}</p>
                      <p className="text-xs text-[#9ca3af] mt-0.5">{formatDateTime(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#9ca3af]">No activity yet.</p>
            )}
          </section>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">
          {/* Stage change */}
          <aside className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-3">Move stage</h2>
            <SelectInput
              value={stage || l.stage}
              onChange={(e) => setStage(e.target.value)}
              options={stageOptions}
            />
            <button
              onClick={() => stage && stage !== l.stage && stageMutation.mutate(stage)}
              disabled={!stage || stage === l.stage || stageMutation.isPending}
              className="mt-3 w-full px-4 py-2.5 rounded-full bg-[#00308a] text-white text-[13px] font-bold hover:bg-[#002266] disabled:opacity-40 transition-all"
            >
              {stageMutation.isPending ? 'Updating…' : 'Update stage'}
            </button>
          </aside>

          {/* Enrichment data */}
          {/* Smart Assignment */}
          <aside className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
            <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-3">Smart Assignment</h2>
            {assigneeSuggestions.isLoading ? (
              <Spinner />
            ) : assigneeSuggestions.data?.items && assigneeSuggestions.data.items.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {assigneeSuggestions.data.items.map((s, i) => (
                  <li key={s.userId} className="flex items-start gap-3 p-3 rounded-2xl bg-[#f9fafb]">
                    <span className="w-7 h-7 rounded-full bg-[#00308a] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0f1117]">{s.displayName}</p>
                      <p className="text-xs text-[#6b7280] mb-1">{s.email}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#f86223]">Score {s.score}</span>
                        <span className="text-xs text-[#9ca3af]">· {s.currentLoad} active</span>
                        <span className="text-xs text-[#9ca3af]">· {Math.round(s.winRate * 100)}% win rate</span>
                      </div>
                      {s.reasons.length > 0 && (
                        <p className="text-[11px] text-[#9ca3af] mt-0.5">{s.reasons.join(' · ')}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#9ca3af]">No rep skill profiles configured yet.</p>
            )}
          </aside>

          {l.enrichmentData && (
            <aside className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
              <h2 className="font-mono text-[12px] font-medium uppercase tracking-wide text-[#9ca3af] mb-3">Enrichment</h2>
              <dl className="flex flex-col gap-2 text-sm">
                {l.enrichmentData.companySize && <Detail label="Company size" value={l.enrichmentData.companySize} />}
                {l.enrichmentData.industry && <Detail label="Industry" value={l.enrichmentData.industry} />}
                {l.enrichmentData.website && <Detail label="Website" value={l.enrichmentData.website} />}
                {l.enrichmentData.techStack && l.enrichmentData.techStack.length > 0 && (
                  <Detail label="Tech stack" value={l.enrichmentData.techStack.join(', ')} />
                )}
              </dl>
              <p className="text-[11px] text-[#9ca3af] mt-3">
                Source: {l.enrichmentData.source}
                {l.enrichmentData.aiInferred ? ' (AI inferred)' : ' (verified)'}
              </p>
            </aside>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-0.5">{label}</dt>
      <dd className="text-[#0f1117]">{value || <span className="text-[#cbd2e0]">—</span>}</dd>
    </div>
  );
}

function ScoreMeter({ label, score, color }: { label: string; score: number; color: string }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#f9fafb]">
      <p className="font-mono text-xs font-medium uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="font-serif text-[32px] font-medium tracking-tight" style={{ color }}>{score}</p>
      <div className="w-full h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ConvList({ label, items }: { label: string; items?: string[] | null }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af] mb-1">{label}</p>
      <ul className="list-disc list-inside space-y-0.5 text-[#0f1117]">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}
