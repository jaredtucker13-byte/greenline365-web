'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatwidgetProps {
  onClose?: () => void;
}

export default function ChatWidget({ onClose }: ChatwidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTryMe, setShowTryMe] = useState(true);
  const [hasClicked, setHasClicked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const clicked = localStorage.getItem('chatwidgetClicked');
    if (clicked === 'true') {
      setShowTryMe(false);
      setHasClicked(true);
    }
  }, []);

  const closeWidget = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleBubbleClick = () => {
    setIsOpen((prev) => !prev);

    if (!hasClicked) {
      setShowTryMe(false);
      setHasClicked(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatwidgetClicked', 'true');
      }
    }
  };

  const sendMessage = async () => {
    if (isLoading || !message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(updatedMessages);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`API ${response.status}: ${errText || 'Failed to get response'}`);
      }

      const data = await response.json();
      const assistantReply =
        data?.choices?.[0]?.message?.content ??
        data?.reply ??
        data?.message ??
        'No response';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantReply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showTryMe && !hasClicked && (
        <div className="fixed bottom-24 right-6 z-50">
          <div className="relative px-4 py-2 rounded-2xl text-sm font-semibold bg-black/70 text-emerald-100 border border-emerald-500/20 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.18)]">
            Try me
            <div className="absolute -bottom-2 right-8 w-4 h-4 rotate-45 bg-black/70 border-r border-b border-emerald-500/20" />
          </div>
        </div>
      )}

      <button
        onClick={handleBubbleClick}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-black/70 border border-emerald-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.18)] hover:scale-110 transition-transform flex items-center justify-center"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        type="button"
      >
        {isOpen ? (
          <svg className="w-7 h-7 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[340px] sm:w-[360px] max-w-[calc(100vw-3rem)] rounded-3xl overflow-hidden bg-black/70 border border-emerald-500/15 backdrop-blur-xl shadow-[0_0_70px_rgba(16,185,129,0.14)]">
          
          <div className="p-5 border-b border-emerald-500/10 bg-black/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] tracking-[0.35em] uppercase font-semibold text-emerald-300/80">
                  PROTOCOL: ACTIVE ASSISTANT
                </div>
                <div className="mt-1 text-2xl font-black text-white">Command Center</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400/90" />
                <span className="w-2 h-2 rounded-full bg-emerald-400/50" />
                <span className="w-2 h-2 rounded-full bg-emerald-400/25" />

                <button
                  onClick={closeWidget}
                  className="ml-2 w-9 h-9 rounded-full border border-emerald-500/15 bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center"
                  type="button"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="h-[320px] overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 && (
              <div>
                <div className="rounded-2xl p-4 bg-white/5 border border-white/10 text-white/90">
                  <div className="text-sm font-semibold">System Online.</div>
                  <div className="text-sm text-white/80 mt-1 leading-relaxed">
                    Initializing Tactical Assistant. How can I help you own the neighborhood today?
                  </div>
                </div>

                <div className="mt-2 text-[10px] tracking-[0.3em] uppercase text-white/35">
                  COMMAND OUTBOUND • ONLINE
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={
                    msg.role === 'user'
                      ? 'max-w-[78%] rounded-2xl rounded-br-md px-4 py-3 text-sm text-black bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.18)]'
                      : 'max-w-[78%] rounded-2xl rounded-bl-md px-4 py-3 text-sm text-white/90 bg-white/5 border border-white/10'
                  }
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[78%] rounded-2xl rounded-bl-md px-4 py-3 text-sm text-white/70 bg-white/5 border border-white/10">
                  Initializing…
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-5 border-t border-emerald-500/10 bg-black/30">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Initiate command…"
                className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none bg-black/50 border border-emerald-500/15 text-white/90 placeholder:text-white/35 focus:ring-2 focus:ring-emerald-400/30"
                disabled={isLoading}
              />

              <button
                onClick={sendMessage}
                disabled={isLoading || !message.trim()}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-400 text-black font-bold shadow-[0_0_25px_rgba(16,185,129,0.20)] hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                type="button"
                aria-label="Send"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h13M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-white/25">
              <span>ENCRYPTION: AES-256</span>
              <span>CONNECTION: ENHANCED</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}