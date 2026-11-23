import { Navigate, useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Spinner } from '../components/Spinner';
import type { Permission } from '@aranax/contracts';

interface Props {
  children: ReactNode;
  /** When set, the user must have this permission (checked against live DB-backed set). */
  permission?: Permission;
}

export function ProtectedRoute({ children, permission }: Props) {
  const { user, permissions, loading } = useAuth();
  const location = useLocation();

  if (loading || (user && permissions === null)) return <Spinner />;

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (permission && !permissions?.has(permission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-[#fff3e0] text-[#e65100] flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h1 className="text-[22px] font-extrabold text-[#0f1117] tracking-tight">No access</h1>
        <p className="text-sm text-[#6b7280] max-w-sm">
          Your role doesn't have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
