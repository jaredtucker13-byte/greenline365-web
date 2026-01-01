'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const response = await fetch('https://n8n.srv1156042.hstgr.cloud/webhook/63b9d5c8-b9c4-4e97-be06-2e4f3e0df180/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, action: 'chat' })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No response' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(93, 254, 202, 0.7); } 50% { box-shadow: 0 0 0 15px rgba(93, 254, 202, 0); } }
        .chat-float { animation: float 3s ease-in-out infinite; }
        .chat-pulse { animation: pulse 2s infinite; }
      `}</style>

      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-float chat-pulse fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-[#5DFECA] to-[#22c55e] rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center justify-center text-3xl"
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-[420px] h-[640px] bg-[#1a1b26] rounded-3xl shadow-2xl flex flex-col z-50 border border-[#5DFECA]/20">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1f2335] to-[#1a2f1a] p-6 border-b border-[#5DFECA]/10 flex justify-between items-center rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#5DFECA] to-[#22c55e] rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-white font-bold">Instant Assistant</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#5DFECA] rounded-full animate-pulse"></span>
                  <p className="text-[#5DFECA] text-xs font-medium">Aiden • Online</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white text-3xl transition-colors leading-none p-2 hover:bg-white/5 rounded-lg"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#1a1b26]">
            {messages.length === 0 && (
              <div className="text-center mt-20 space-y-4">
                <p className="text-white/60 text-sm">
                  Welcome to GreenLine365. I'm Aiden.<br/>
                  How can I help your business grow today?
                </p>
                <p className="text-[#5DFECA]/40 text-xs italic">
                  e.g. "How would this work for a landscaping business?"
                </p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 rounded-2xl max-w-[85%] ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-[#5DFECA] to-[#4ade80] text-[#0a1a1a] font-semibold rounded-br-sm' 
                    : 'bg-[#24283b] text-white/90 border border-[#5DFECA]/10 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#24283b] p-4 rounded-2xl rounded-bl-sm border border-[#5DFECA]/10">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#5DFECA] rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-[#5DFECA] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                    <span className="w-2 h-2 bg-[#5DFECA] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-5 bg-[#1f2335] border-t border-[#5DFECA]/10 rounded-b-3xl">
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your question..."
                className="flex-1 bg-[#1a1b26] text-white border-2 border-[#5DFECA]/10 rounded-2xl px-4 py-3 outline-none focus:border-[#5DFECA] transition-all placeholder-white/30"
                disabled={isLoading}
              />
              <button 
                onClick={sendMessage}
                disabled={isLoading || !message.trim()}
                className="bg-gradient-to-br from-[#5DFECA] to-[#4ade80] text-[#0a1a1a] px-6 py-3 rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}