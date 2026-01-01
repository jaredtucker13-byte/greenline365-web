'use client';

import { useState, useEffect, useRef } from 'react';

// Unified "Tokyo Night" Assistant Component
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of "Molecule" window
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Direct Connection to hstgr.cloud n8n Logic Belt
      const response = await fetch('https://n8n.srv1156042.hstgr.cloud/webhook/66392a57-93ac-4faf-aa60-4829b037819d/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.content,
          action: 'chat'
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No response' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Hmm, let me check with the team...' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        /* Floating Animation with Gradient Shift */
        @keyframes floatIntelligence {
          0%, 100% { transform: translateY(0px); filter: brightness(1); }
          50% { transform: translateY(-12px); filter: brightness(1.2); }
        }

        /* Tokyo Night Wave Shimmer - #5DFECA Accent */
        @keyframes tokyoShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        /* Custom Thinking Indicator */
        @keyframes shimmerDots {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; color: #5DFECA; }
        }

        .assistant-trigger {
          animation: floatIntelligence 4s ease-in-out infinite;
          background: linear-gradient(135deg, #1a1b26 0%, #24283b 50%, #1a1b26 100%);
          background-size: 200% 200%;
          border: 2px solid #5DFECA;
          box-shadow: 0 8px 32px rgba(93, 254, 202, 0.2);
        }

        .thinking-dot { animation: shimmerDots 1.4s infinite ease-in-out both; }
        .thinking-dot:nth-child(1) { animation-delay: -0.32s; }
        .thinking-dot:nth-child(2) { animation-delay: -0.16s; }

        .tokyo-shadow-dom {
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }
      `}</style>

      {/* 1. THE TRIGGER (Atom) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="assistant-trigger fixed bottom-8 right-8 w-20 h-20 rounded-full z-50 flex items-center justify-center text-4xl transition-all duration-500 hover:scale-110 active:scale-95"
          aria-label="Open Instant Assistant"
        >
          <span style={{ color: '#5DFECA' }}>💬</span>
        </button>
      )}

      {/* 2. THE UNIFIED FLIGHT DECK (Molecule) */}
      {isOpen && (
        <div className="tokyo-shadow-dom fixed bottom-8 right-8 w-[420px] h-[640px] bg-[#1a1b26] rounded-[2rem] flex flex-col z-50 border border-[#5DFECA]/20 overflow-hidden transition-all duration-500">
          
          {/* Header - Tokyo Night Aesthetic */}
          <div className="bg-[#1f2335] p-6 border-b border-[#5DFECA]/10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#5DFECA] to-[#2ac3de] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5DFECA]/20 rotate-3">
                <span className="text-3xl rotate-[-3deg]">🤖</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-xl tracking-tight">Instant Assistant</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#5DFECA] rounded-full animate-pulse"></span>
                  <p className="text-[#5DFECA] text-xs font-medium uppercase tracking-widest">Aiden • Online</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-white/40 hover:text-[#5DFECA] text-3xl transition-colors p-2"
            >
              ×
            </button>
          </div>

          {/* Messages Area - Dark Mode Foundation */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#1a1b26]">
            {messages.length === 0 && (
              <div className="text-center mt-20 space-y-6 px-4 animate-pulse">
                <p className="text-white/60 text-sm leading-relaxed">
                  Welcome to GreenLine365. I'm Aiden.<br/>
                  How can I help your business grow today?
                </p>
                <div className="text-[#5DFECA]/40 text-xs italic">
                  e.g. "How would this work for a landscaping business?"
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#5DFECA] text-[#1a1b26] font-semibold rounded-tr-sm' 
                    : 'bg-[#24283b] text-white/90 border border-[#5DFECA]/10 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#24283b] p-5 rounded-2xl rounded-tl-sm border border-[#5DFECA]/10">
                  <div className="flex gap-2 text-[#5DFECA]">
                    <span className="thinking-dot text-lg">•</span>
                    <span className="thinking-dot text-lg">•</span>
                    <span className="thinking-dot text-lg">•</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Field (Atom) */}
          <div className="p-6 bg-[#1f2335] border-t border-[#5DFECA]/10">
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Direct line to intelligence..."
                className="flex-1 bg-[#1a1b26] text-white border-2 border-[#5DFECA]/10 rounded-2xl px-5 py-4 outline-none focus:border-[#5DFECA] focus:ring-4 focus:ring-[#5DFECA]/10 transition-all placeholder-white/20"
                disabled={isLoading}
              />
              <button 
                onClick={sendMessage}
                disabled={isLoading || !message.trim()}
                className="bg-[#5DFECA] text-[#1a1b26] px-8 py-4 rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#5DFECA]/20 disabled:opacity-50"
              >
                {isLoading ? '...' : 'SEND'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
