import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CopilotResponse {
  answer: string;
  dataUsed: string[];
}

/** Maps a copilot entity-reference type to the route that shows it. Falls back to no link. */
function hrefFor(type: string, id: string): string | null {
  switch (type) {
    case 'lead': return `/leads/${id}`;
    case 'opportunity': return `/opportunities/${id}`;
    case 'customer': return `/customers/${id}`;
    case 'campaign': return `/campaigns/${id}`;
    case 'referral': return `/referrals/${id}`;
    case 'followup': return '/follow-ups'; // no detail route; links to the list
    default: return null;
  }
}

/**
 * Renders the copilot's answer text, turning [[type:id|Name]] entity references into links to
 * the matching CRM page and **bold** markdown into <strong>. No other markdown is expected.
 */
const UUID_RE = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const REF_SRC = `\\[\\[[a-z]+:${UUID_RE}\\|.+?\\]\\]`;
const REF_RE = new RegExp(`\\[\\[([a-z]+):(${UUID_RE})\\|(.+?)\\]\\]`, 'i');

function Formatted({ text }: { text: string }) {
  const tokens = text.split(new RegExp(`(${REF_SRC}|\\*\\*[^*]+\\*\\*)`, 'gi'));
  return (
    <>
      {tokens.map((token, i) => {
        const refMatch = REF_RE.exec(token);
        if (refMatch) {
          const [, type, id, label] = refMatch;
          const href = hrefFor(type, id);
          return href ? (
            <Link key={i} to={href} className="underline decoration-dotted underline-offset-2 hover:text-[#f86223] transition-colors">
              {label}
            </Link>
          ) : (
            label
          );
        }
        if (token.startsWith('**') && token.endsWith('**')) return <strong key={i}>{token.slice(2, -2)}</strong>;
        return token;
      })}
    </>
  );
}

const STORAGE_KEY = 'aranax.copilot.session';

interface StoredState {
  open: boolean;
  messages: Message[];
}

function loadStoredState(): StoredState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { open: false, messages: [] };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return { open: parsed.open ?? false, messages: parsed.messages ?? [] };
  } catch {
    return { open: false, messages: [] };
  }
}

function CopilotIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor" />
    </svg>
  );
}

export function SalesCopilot() {
  const [initial] = useState(loadStoredState);
  const [open, setOpen] = useState(initial.open);
  const [messages, setMessages] = useState<Message[]>(initial.messages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ open, messages }));
    } catch {
      // storage unavailable (private mode, quota) — chat just won't persist
    }
  }, [open, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const nextMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const res = await http.post<CopilotResponse>(endpoints.copilot.query, {
        question: text,
        history: messages.slice(-10),
      });
      setMessages([...nextMessages, { role: 'assistant', content: res.answer }]);
    } catch (err) {
      setMessages([...nextMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close AI Copilot' : 'Open AI Copilot'}
        className="fixed bottom-6 right-6 z-[200] w-12 h-12 rounded-full bg-[#00308a] text-white shadow-[0_4px_20px_rgba(0,48,138,.45)] hover:bg-[#002266] active:scale-95 transition-all flex items-center justify-center"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="1" fill="currentColor" />
            <circle cx="8" cy="10" r="1" fill="currentColor" />
            <circle cx="16" cy="10" r="1" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* Slide-out panel */}
      {open && (
        <div className="fixed bottom-[76px] right-6 z-[200] w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-[24px] shadow-[0_12px_48px_rgba(0,0,0,.18),0_2px_8px_rgba(0,0,0,.08)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-[#00308a]">
            <div className="w-8 h-8 rounded-full bg-[#f86223] flex items-center justify-center flex-shrink-0">
              <CopilotIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">AI Sales Copilot</p>
              <p className="text-[11px] text-white/60">Ask anything about your pipeline</p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-[11px] font-medium text-white/70 hover:text-white transition-colors flex-shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 max-h-[380px] flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[#9ca3af]">Ask about leads, opportunities, revenue or pipeline status.</p>
                <div className="flex flex-col gap-2 mt-4">
                  {['How many open opportunities do we have?', 'Which leads need attention today?', 'What is our forecast for next 30 days?'].map((q) => (
                    <button key={q} onClick={() => { setInput(q); }} className="text-xs text-left px-3 py-2 rounded-xl bg-[#f1f5f9] text-[#6b7280] hover:bg-[#e2e8f0] transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#00308a] text-white rounded-br-sm' : 'bg-[#f3f4f6] text-[#0f1117] rounded-bl-sm'}`}>
                  <Formatted text={msg.content} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#f3f4f6] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 px-4 pb-4 pt-2 border-t border-[#f1f5f9]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              disabled={loading}
              placeholder="Ask your copilot…"
              className="flex-1 px-4 py-2.5 rounded-full border border-[#e2e6f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#00308a]/20 focus:border-[#00308a] disabled:opacity-50 transition"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="w-10 h-10 rounded-full bg-[#00308a] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#002266] active:scale-95 transition-all flex-shrink-0"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
