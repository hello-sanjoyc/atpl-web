import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../components/Toast';
import { apiClient, unwrap } from '../../api/client';
import type { Role } from '@aranax/contracts';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: { id: string; name: string; email: string; role: Role };
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiClient.post<{ success: true; data: LoginResponse; meta: { requestId: string } }>('/auth/login', data);
      const { accessToken, user } = unwrap(res.data);
      await login(accessToken, user);
      await navigate(params.get('redirect') ?? '/dashboard', { replace: true });
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Login failed', 'error');
    }
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
              Close more deals,<br />
              <span className="text-[#f86223]">with less busywork.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/65 max-w-[36ch]">
              Track leads, manage your pipeline, and stay on top of every follow-up
              from a single dashboard.
            </p>
          </div>

        </aside>

        {/* Form panel */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-8 sm:p-10 flex flex-col justify-center"
          noValidate
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="flex items-center text-[#f86223]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill="currentColor" />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight text-[#0f1117]">Aranax</span>
          </div>

          <h1 className="text-[28px] font-extrabold tracking-[-1px] text-[#0f1117]">
            Welcome back
          </h1>
          <p className="text-sm text-[#6b7280] mt-1 mb-7">
            Sign in to continue to your dashboard.
          </p>

          <div className="mb-4">
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

          <div className="mb-3">
            <div className="flex items-baseline justify-between mb-1.5">
              <label htmlFor="password" className="block text-[13px] font-semibold text-[#0f1117]">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-[#6b7280] hover:text-[#0f1117] transition-colors">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                aria-invalid={!!errors.password}
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-controls="password"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-[#9ca3af] hover:text-[#0f1117] hover:bg-[#e4e9f4] transition-colors"
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-[#c62828]">
                {errors.password.message}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 mb-6 text-[13px] text-[#6b7280] select-none cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-[#e2e6f0] accent-[#f86223] cursor-pointer"
            />
            Keep me signed in
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
