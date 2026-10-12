'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';

type Source = { text?: string; page?: number; score?: number };

const PROMPTS = [
  {
    label: 'Tech vs. box office',
    text: 'How is the portrayal of technology linked to MCU box office performance?',
  },
  {
    label: 'Science domains',
    text: 'Which applied science domains appear most often in MCU movies?',
  },
  {
    label: 'Tech boost',
    text: 'What is the “tech boost” effect described in the case study?',
  },
  {
    label: 'Endgame',
    text: 'Why does Avengers: Endgame stand out in the box-office analysis?',
  },
];

export default function Page() {
  const { messages, input, setInput, handleInputChange, handleSubmit, append, status, error, stop, setMessages } =
    useChat({
      api: '/api/chat',
      maxSteps: 3,
    });

  const busy = status === 'submitted' || status === 'streaming';
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  function ask(text: string) {
    void append({ role: 'user', content: text });
  }

  return (
    <div className="nexus-shell nexus-grid">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-4 md:px-6 md:py-6">
        <Header
          busy={busy}
          hasMessages={messages.length > 0}
          onReset={() => {
            setMessages([]);
            setInput('');
          }}
        />

        <div className="mt-4 grid min-h-0 flex-1 gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden md:block">
            <Sidebar onAsk={ask} disabled={busy} />
          </aside>

          <section className="glass flex min-h-[70vh] flex-col overflow-hidden rounded-2xl shadow-glow md:min-h-[calc(100vh-7.5rem)]">
            <div className="chat-scroll flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
              {messages.length === 0 ? (
                <EmptyState onAsk={ask} disabled={busy} />
              ) : (
                messages.map((m) => (
                  <MessageBlock
                    key={m.id}
                    role={m.role}
                    content={m.content}
                    sources={collectSources(m.toolInvocations)}
                    pending={
                      m.role === 'assistant' &&
                      !m.content &&
                      busy &&
                      m.id === messages[messages.length - 1]?.id
                    }
                  />
                ))
              )}

              {busy && messages[messages.length - 1]?.role === 'user' && (
                <MessageBlock role="assistant" content="" sources={[]} pending />
              )}

              {error && (
                <p className="rounded-xl border border-iron/40 bg-iron/10 px-4 py-3 text-sm text-red-200">
                  The briefing stalled: {error.message}
                </p>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-gold/15 bg-black/20 p-3 sm:p-4"
            >
              <label htmlFor="nexus-input" className="sr-only">
                Ask about MCU technology and box office performance
              </label>
              <div className="flex items-end gap-2 rounded-xl border border-gold/20 bg-[#0b101c] px-3 py-2 focus-within:border-gold/50">
                <textarea
                  id="nexus-input"
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask how MCU tech maps to the box office…"
                  className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent py-2 text-[15px] text-ink placeholder:text-mute/70 focus:outline-none"
                />
                {busy ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="mb-1 rounded-lg border border-iron/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 hover:bg-iron/15"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="mb-1 rounded-lg bg-gold px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#1a1408] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Send
                  </button>
                )}
              </div>
              <p className="mt-2 px-1 text-[11px] text-mute">
                Grounded in Iqra Tariq’s MCU case study · Enter to send · Shift+Enter for a new line
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Header({
  busy,
  hasMessages,
  onReset,
}: {
  busy: boolean;
  hasMessages: boolean;
  onReset: () => void;
}) {
  return (
    <header className="glass flex items-center justify-between rounded-2xl px-4 py-3 shadow-glow sm:px-5">
      <div className="flex items-center gap-3">
        <ReactorMark />
        <div>
          <p className="font-display text-[11px] uppercase tracking-[0.28em] text-gold">
            Case study briefing
          </p>
          <h1 className="font-display text-lg font-bold leading-tight text-ink sm:text-xl">
            The Nexus
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 text-xs text-mute sm:flex">
          <span
            className={`h-1.5 w-1.5 rounded-full ${busy ? 'bg-arc shadow-arc' : 'bg-gold'}`}
          />
          {busy ? 'Retrieving' : 'Ready'}
        </span>
        {hasMessages && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-gold/25 px-3 py-1.5 text-xs uppercase tracking-wide text-gold hover:bg-gold/10"
          >
            New chat
          </button>
        )}
      </div>
    </header>
  );
}

function Sidebar({ onAsk, disabled }: { onAsk: (text: string) => void; disabled: boolean }) {
  return (
    <div className="glass flex h-full flex-col rounded-2xl p-5">
      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-gold">Dossier</p>
      <h2 className="mt-2 font-display text-xl font-bold leading-snug">
        MCU technology × box office
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-mute">
        Ask this bot about how Marvel Cinematic Universe films portray applied science — and whether denser
        technology on screen tracks with commercial success.
      </p>
      <div className="gold-rule my-5" />
      <p className="text-[11px] uppercase tracking-[0.18em] text-mute">Suggested questions</p>
      <ul className="mt-3 space-y-2">
        {PROMPTS.map((p) => (
          <li key={p.label}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAsk(p.text)}
              className="w-full rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-left text-sm text-ink/90 hover:border-gold/30 hover:bg-gold/5 disabled:opacity-50"
            >
              {p.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6 text-xs text-mute">
        <p>Corpus · 17-page case study</p>
        <p className="mt-1">Iqra Tariq · Tech Content Count &amp; “tech boost”</p>
      </div>
    </div>
  );
}

function EmptyState({ onAsk, disabled }: { onAsk: (text: string) => void; disabled: boolean }) {
  return (
    <div className="flex h-full min-h-[52vh] flex-col items-center justify-center px-2 py-8 text-center">
      <div className="reactor-pulse">
        <ReactorMark large />
      </div>
      <p className="mt-6 font-display text-[11px] uppercase tracking-[0.32em] text-gold">
        Science fiction · box office · technology
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Open a briefing</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-mute">
        This chat is grounded in a case study of MCU films: which sciences they show, how spectacle sells, and
        whether a higher Tech Content Count predicts a bigger opening.
      </p>
      <ul className="mt-8 grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {PROMPTS.map((p) => (
          <li key={p.label}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAsk(p.text)}
              className="h-full w-full rounded-xl border border-gold/20 bg-black/20 px-4 py-3 text-left text-sm hover:border-gold/45 hover:bg-gold/5 disabled:opacity-50"
            >
              <span className="block text-[11px] uppercase tracking-wider text-gold">{p.label}</span>
              <span className="mt-1 block text-ink/85">{p.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageBlock({
  role,
  content,
  sources,
  pending,
}: {
  role: string;
  content: string;
  sources: Source[];
  pending?: boolean;
}) {
  const isUser = role === 'user';

  return (
    <article className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[min(100%,40rem)] ${isUser ? 'text-right' : ''}`}>
        <p
          className={`mb-1 text-[10px] uppercase tracking-[0.2em] ${
            isUser ? 'text-gold' : 'text-arc'
          }`}
        >
          {isUser ? 'You' : 'Nexus analyst'}
        </p>
        <div
          className={
            isUser
              ? 'inline-block rounded-2xl rounded-tr-sm bg-gradient-to-br from-gold/90 to-[#c9a24e] px-4 py-3 text-left text-[15px] leading-relaxed text-[#1a1408]'
              : 'rounded-2xl rounded-tl-sm border border-arc/15 bg-[#0b111d] px-4 py-3 text-left text-[15px] leading-relaxed text-ink'
          }
        >
          {pending && !content ? (
            <span className="flex items-center gap-1 text-mute">
              <span className="dot h-1.5 w-1.5 rounded-full bg-arc" />
              <span className="dot h-1.5 w-1.5 rounded-full bg-arc" />
              <span className="dot h-1.5 w-1.5 rounded-full bg-arc" />
              <span className="ml-2 text-xs uppercase tracking-wider">Consulting the case study</span>
            </span>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>

        {!isUser && sources.length > 0 && (
          <details className="mt-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-left">
            <summary className="flex items-center justify-between text-xs text-mute">
              <span>Retrieved passages ({sources.length})</span>
              <span className="src-toggle text-gold" />
            </summary>
            <ul className="mt-3 space-y-3">
              {sources.map((src, i) => (
                <li key={i} className="border-l-2 border-arc/70 pl-3">
                  <p className="text-[11px] uppercase tracking-wider text-gold/80">
                    Page {src.page ?? '?'} · score{' '}
                    {typeof src.score === 'number' ? src.score.toFixed(2) : '—'}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/80">{src.text}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}

function collectSources(
  invocations?: Array<{
    state: string;
    toolName: string;
    toolCallId: string;
    result?: unknown;
  }>,
): Source[] {
  if (!invocations) return [];
  return invocations.flatMap((inv) =>
    inv.state === 'result' && inv.toolName === 'getInformation' ? ((inv.result as Source[]) ?? []) : [],
  );
}

function ReactorMark({ large }: { large?: boolean }) {
  const size = large ? 72 : 36;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      aria-hidden="true"
      className={large ? 'drop-shadow-[0_0_18px_rgba(92,225,230,0.35)]' : ''}
    >
      <circle cx="36" cy="36" r="33" fill="none" stroke="rgba(232,195,106,0.35)" strokeWidth="1.5" />
      <circle cx="36" cy="36" r="24" fill="none" stroke="#5ce1e6" strokeWidth="1.25" opacity="0.7" />
      <polygon
        points="36,16 53,26 53,46 36,56 19,46 19,26"
        fill="none"
        stroke="#e8c36a"
        strokeWidth="1.5"
      />
      <circle cx="36" cy="36" r="7" fill="#5ce1e6" opacity="0.9" />
      <circle cx="36" cy="36" r="3" fill="#f4fbff" />
    </svg>
  );
}
