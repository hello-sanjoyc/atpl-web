import { useState } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { PublicLayout } from './PublicLayout';
import { Field, TextInput } from '../../components/form/fields';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { Spinner } from '../../components/Spinner';
import { ErrorState } from '../../components/ErrorState';
import { useToast } from '../../components/Toast';

const PRIVACY_VERSION = '2025-01';

interface AssessmentOption { value: string; label: string; points: number }
interface AssessmentQuestion { id: string; label: string; options: AssessmentOption[] }
interface AssessmentDef { slug: string; title: string; description?: string; questions: AssessmentQuestion[] }
interface SubmitResult { score?: number; band?: { label: string; recommendation: string } }

export default function Assessment() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const def = useQuery<AssessmentDef>({
    queryKey: ['assessment', slug],
    queryFn: () => http.get<AssessmentDef>(endpoints.public.assessment.bySlug(slug!)),
    enabled: !!slug,
  });

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: '', email: '', company: '' });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  if (def.isLoading) return <PublicLayout title="Loading…"><Spinner /></PublicLayout>;
  if (def.error) return <PublicLayout title="Assessment"><ErrorState error={def.error} /></PublicLayout>;
  const a = def.data!;

  const allAnswered = a.questions.every((q) => answers[q.id]);
  const canSubmit = allAnswered && contact.name && contact.email && consent && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: contact.name,
        email: contact.email,
        answers,
        consent: { privacyPolicy: true, privacyPolicyVersion: PRIVACY_VERSION, marketing: false },
      };
      if (contact.company) body.company = contact.company;
      const res = await http.post<SubmitResult>(endpoints.public.assessment.submit(slug!), body);
      setResult(res ?? {});
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <PublicLayout title="Your result">
        {result.band ? (
          <>
            <div className="flex items-baseline gap-3 mb-3">
              {result.score != null && <span className="text-[40px] font-extrabold text-[#0f1117] leading-none">{result.score}</span>}
              <span className="text-lg font-bold text-[#9a3b12]">{result.band.label}</span>
            </div>
            <p className="text-sm leading-relaxed text-[#6b7280]">{result.band.recommendation}</p>
          </>
        ) : (
          <p className="text-sm text-[#6b7280]">Thanks — we've recorded your responses.</p>
        )}
      </PublicLayout>
    );
  }

  return (
    <PublicLayout title={a.title} subtitle={a.description}>
      <div className="flex flex-col gap-6">
        {a.questions.map((q, i) => (
          <fieldset key={q.id}>
            <legend className="text-[14px] font-semibold text-[#0f1117] mb-2">
              {i + 1}. {q.label}
            </legend>
            <div className="flex flex-col gap-2">
              {q.options.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                    answers[q.id] === opt.value
                      ? 'border-[#f86223] bg-[#fde8dd]'
                      : 'border-[#e2e6f0] bg-[#f7f9fd] hover:border-[#cbd2e0]'
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.value}
                    checked={answers[q.id] === opt.value}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                    className="w-4 h-4 accent-[#f86223]"
                  />
                  <span className="text-sm text-[#0f1117]">{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="pt-4 border-t border-[#eef1f7] grid sm:grid-cols-2 gap-4">
          <Field label="Name" htmlFor="a-name" required>
            <TextInput id="a-name" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} />
          </Field>
          <Field label="Email" htmlFor="a-email" required>
            <TextInput id="a-email" type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} />
          </Field>
          <Field label="Company" htmlFor="a-company" className="sm:col-span-2">
            <TextInput id="a-company" value={contact.company} onChange={(e) => setContact((c) => ({ ...c, company: e.target.value }))} />
          </Field>
        </div>

        <label className="flex items-start gap-2 text-[13px] text-[#6b7280]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-[#e2e6f0] accent-[#f86223]" />
          I accept the privacy policy.
        </label>

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Submitting…' : 'See my result'}
        </button>
      </div>
    </PublicLayout>
  );
}
