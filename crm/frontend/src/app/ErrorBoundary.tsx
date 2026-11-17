import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 min-h-screen px-6 text-center"
        >
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f1117]">
            Something went wrong
          </h1>
          <p className="text-sm text-[#6b7280] max-w-sm">
            Please reload the page. If the problem persists, contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-5 py-2 rounded-full bg-[#f86223] text-white text-[13px] font-bold hover:bg-[#d94f15] transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
