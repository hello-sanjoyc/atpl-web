import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link } from 'react-router';

const schema = z.object({
  email: z.string().email(),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // TODO: no backend endpoint exists yet — this only renders the confirmation
  // state. Wire to POST /auth/forgot-password once the route is available.
  const onSubmit = (data: FormData) => {
    setSentTo(data.email);
  };

  const inputClass =
    'w-full px-4 py-3 rounded-2xl bg-[#f7f9fd] border border-[#e2e6f0] text-sm text-[#0f1117] placeholder:text-[#9ca3af] outline-none focus:bg-white focus:border-[#f86223] focus:ring-4 focus:ring-[#f86223]/25 aria-[invalid=true]:border-[#c62828] aria-[invalid=true]:bg-[#fff5f7] aria-[invalid=true]:focus:border-[#c62828] aria-[invalid=true]:focus:ring-[#c62828]/20 transition-all';

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[980px] grid lg:grid-cols-2 bg-white rounded-[32px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,.10),0_2px_8px_rgba(0,0,0,.04)]">

        {/* Brand panel */}
        <aside className="hidden lg:flex flex-col bg-[#00308a] p-10 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-[#f86223]/15 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-28 -left-16 w-72 h-72 rounded-full bg-[#f86223]/10 blur-2xl"
          />

          <div className="relative flex items-center gap-2">
            <span className="flex items-center text-[#f86223]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill="currentColor" />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight text-white">Aranax</span>
          </div>

          <div className="relative my-auto">
            <h2 className="text-[34px] leading-[1.15] font-extrabold tracking-[-1px] text-white">
              Locked out?<br />
              <span className="text-[#f86223]">Back in a minute.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65 max-w-[36ch]">
              We'll email you a secure link to set a new password. The link
              expires after a short while, so use it soon.
            </p>
          </div>
        </aside>

        {/* Form panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="flex items-center text-[#f86223]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill="currentColor" />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight text-[#0f1117]">Aranax</span>
          </div>

          {sentTo ? (
            <div role="status">
              <span className="w-12 h-12 rounded-2xl bg-[#fde8dd] text-[#9a3b12] flex items-center justify-center mb-5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </span>

              <h1 className="text-[28px] font-extrabold tracking-[-1px] text-[#0f1117]">
                Check your email
              </h1>
              <p className="text-sm leading-relaxed text-[#6b7280] mt-2">
                If an account exists for{' '}
                <span className="font-semibold text-[#0f1117]">{sentTo}</span>, we've
                sent a link to reset your password.
              </p>

              <button
                type="button"
                onClick={() => setSentTo(null)}
                className="mt-6 text-[13px] font-semibold text-[#0f1117] hover:underline"
              >
                Use a different email
              </button>

              <Link
                to="/login"
                className="mt-7 w-full py-3.5 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] transition-all flex items-center justify-center"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <h1 className="text-[28px] font-extrabold tracking-[-1px] text-[#0f1117]">
                Forgot password?
              </h1>
              <p className="text-sm text-[#6b7280] mt-1 mb-7">
                Enter your email and we'll send you a reset link.
              </p>

              <div className="mb-6">
                <label htmlFor="email" className="block text-[13px] font-semibold text-[#0f1117] mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                  className={inputClass}
                />
                {errors.email && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-[#c62828]">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Send reset link
              </button>

              <p className="mt-6 text-center text-[13px] text-[#6b7280]">
                Remembered it?{' '}
                <Link to="/login" className="font-semibold text-[#0f1117] hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
