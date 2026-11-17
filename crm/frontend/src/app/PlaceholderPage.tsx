import { AppShell } from '../components/layout/AppShell';

interface Props {
  title: string;
}

export default function PlaceholderPage({ title }: Props) {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <h1 className="text-[28px] font-extrabold text-[#0f1117] tracking-tight">{title}</h1>
        <p className="text-sm text-[#9ca3af]">This section is coming soon.</p>
      </div>
    </AppShell>
  );
}
