import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type ToastVariant = 'error' | 'success' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const DURATION = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(list => list.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = 'error') => {
    const id = nextId.current++;
    setToasts(list => [...list, { id, message, variant }]);
    timers.current.set(id, setTimeout(() => dismiss(id), DURATION));
  }, [dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => { pending.forEach(clearTimeout); pending.clear(); };
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed z-[400] bottom-6 right-6 flex flex-col-reverse gap-3 pointer-events-none max-sm:bottom-4 max-sm:right-4 max-sm:left-4"
      >
        {toasts.map(t => <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

const ACCENT: Record<ToastVariant, string> = {
  error:   '#ff6b6b',
  success: '#f86223',
  info:    '#7dd3fc',
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const accent = ACCENT[toast.variant];

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={[
        'pointer-events-auto flex items-start gap-3 w-[360px] max-sm:w-full',
        'bg-[#00308a] rounded-2xl pl-4 pr-3 py-3.5',
        'shadow-[0_8px_32px_rgba(0,0,0,.28),0_2px_8px_rgba(0,0,0,.16)]',
        'transition-all duration-300 ease-out',
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
      ].join(' ')}
    >
      <span
        className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${accent}26`, color: accent }}
      >
        {toast.variant === 'success' ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
            <line x1="12" y1="7" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </span>

      <p className="flex-1 text-[13px] leading-relaxed font-medium text-white/90 pt-px">
        {toast.message}
      </p>

      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-white/45 hover:text-white hover:bg-white/10 transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
