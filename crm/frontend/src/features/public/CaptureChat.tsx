import { useState, useRef, useEffect } from 'react';
import { PublicLayout } from './PublicLayout';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import Enquiry from './Enquiry';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponseData {
  text: string;
  captureComplete: boolean;
  leadId: string | null;
}

const GREETING = "Hi! I'm here to help connect you with the right Aranax team member. What brings you here today?";

/** Tab selector between AI chat and static form. */
function TabBar({ active, onChange }: { active: 'chat' | 'form'; onChange: (t: 'chat' | 'form') => void }) {
  return (
    <div className="flex gap-1 mb-6 bg-[#f3f4f6] p-1 rounded-full text-sm font-medium">
      {(['chat', 'form'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex-1 py-1.5 rounded-full transition-all ${
            active === tab
              ? 'bg-white text-[#0f1117] shadow-sm'
              : 'text-[#6b7280] hover:text-[#0f1117]'
          }`}
        >
          {tab === 'chat' ? 'Chat with AI' : 'Use form instead'}
        </button>
      ))}
    </div>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <span className="w-7 h-7 rounded-full bg-[#f86223] text-white flex items-center justify-center text-xs font-bold mr-2 mt-0.5 flex-shrink-0">
          A
        </span>
      )}
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-[#f86223] text-white rounded-br-sm'
            : 'bg-[#f3f4f6] text-[#0f1117] rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <span className="w-7 h-7 rounded-full bg-[#f86223] text-white flex items-center justify-center text-xs font-bold mr-2 mt-0.5 flex-shrink-0">
        A
      </span>
      <div className="bg-[#f3f4f6] px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: GREETING },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || done) return;

    const nextMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await http.post<ChatResponseData>(endpoints.public.chatMessage, {
        messages: nextMessages,
      });

      const { text: reply, captureComplete } = res;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);

      if (captureComplete) {
        setDone(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-[#dcfce7] flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[#0f1117] mb-2">You're all set!</h2>
        <p className="text-sm text-[#6b7280] leading-relaxed">
          Thanks for chatting with us. A member of the Aranax team will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Message area */}
      <div className="h-72 overflow-y-auto pr-1 mb-4">
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        {error && (
          <p className="text-xs text-[#c62828] text-center mb-2">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading || done}
          placeholder="Type your reply…"
          className="flex-1 px-4 py-2.5 rounded-full border border-[#e2e6f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#f86223]/30 focus:border-[#f86223] disabled:opacity-50 transition"
          autoFocus
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading || done}
          aria-label="Send"
          className="w-10 h-10 rounded-full bg-[#f86223] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#d94f15] active:scale-95 transition-all flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="text-[11px] text-[#9ca3af] text-center mt-3">
        Powered by AI · Your data is handled per our privacy policy.
      </p>
    </div>
  );
}

/** Main export — tabs between AI chat and static form. */
export default function CaptureChat() {
  const [tab, setTab] = useState<'chat' | 'form'>('chat');

  return (
    <PublicLayout
      title="Get in touch"
      subtitle="Chat with our AI assistant or fill out the form."
    >
      <TabBar active={tab} onChange={setTab} />
      {tab === 'chat' ? <AiChat /> : <Enquiry embedded />}
    </PublicLayout>
  );
}
