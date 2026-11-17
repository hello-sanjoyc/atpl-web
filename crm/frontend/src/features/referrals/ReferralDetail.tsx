import { useParams, Link } from 'react-router';
import { AppShell } from '../../components/layout/AppShell';
import { Spinner } from '../../components/Spinner';
import { ErrorState } from '../../components/ErrorState';
import { useResourceDetail } from '../_shared/hooks';
import { endpoints } from '../../api/endpoints';
import { formatDate } from '../../lib/format';
import type { Referral } from '../_shared/types';

export default function ReferralDetail() {
  const { id } = useParams<{ id: string }>();
  const referral = useResourceDetail<Referral>(['referrals', id], id ? endpoints.referrals.byId(id) : null);

  if (referral.isLoading) return <AppShell><Spinner /></AppShell>;
  if (referral.error) return <AppShell><ErrorState error={referral.error} /></AppShell>;
  const r = referral.data!;

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4 pt-4 text-[13px] text-[#6b7280]">
        <Link to="/referrals" className="font-medium hover:text-[#0f1117] transition-colors">Referrals</Link>
        <span aria-hidden>/</span>
        <span className="font-semibold text-[#0f1117] truncate">{r.code}</span>
      </div>

      <h1 className="text-[32px] font-extrabold tracking-[-1px] text-[#0f1117] leading-tight mb-6 font-mono">{r.code}</h1>

      <section className="bg-white rounded-[28px] p-6 shadow-[0_4px_16px_rgba(0,0,0,.08)] max-w-2xl">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#9ca3af] mb-4">Details</h2>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Detail label="Code" value={r.code} />
          <Detail label="Referrer name" value={r.referrerName} />
          <Detail label="Referrer email" value={r.referrerEmail} />
          <Detail label="Created" value={formatDate(r.createdAt)} />
        </dl>
      </section>
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
