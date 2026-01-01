'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
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
      const response = await fetch('https://n8n.srv1156042.hstgr.cloud/webhook/66392a57-93ac-4faf-aa60-4829b037819d/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No response' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to chat' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes waveShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); } 50% { box-shadow: 0 0 0 20px rgba(74, 222, 128, 0); } }
        .chat-button {
          animation: float 4s ease-in-out infinite, pulse 3s ease-in-out infinite, waveShimmer 6s linear infinite;
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 25%, #86efac 50%, #22c55e 75%, #4ade80 100%);
          background-size: 400% 400%;
        }
      `}</style>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-button fixed bottom-6 right-6 w-20 h-20 rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center justify-center text-4xl"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-[#0a1a1a] rounded-3xl shadow-2xl flex flex-col z-50 border border-green-500/30 overflow-hidden">
          {/* Header */}
          <div className="bg-[#1a2f1a] p-6 border-b border-green-500/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl">🤖</div>
              <div>
                <h3 className="text-white font-bold">Instant Assistant</h3>
                <p className="text-green-400 text-xs">Aiden • Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/60 text-2xl hover:text-white">×</button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0a1a1a]">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20 text-sm">
                Have a specific question about your business niche?<br/>
                Ask our ecosystem intelligence for an instant strategic answer.
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`${msg.role === 'user' ? 'ml-auto' : 'mr-auto'} max-w-[85%]`}>
                <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-green-500 text-white' : 'bg-[#1a2f1a] text-gray-200 border border-green-500/10'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-green-500 text-xs animate-pulse">Aiden is thinking...</div>}
          </div>

          {/* Input */}
          <div className="p-4 bg-[#0f1f0f] border-t border-green-500/20 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your question..."
              className="flex-1 bg-[#1a2f1a] text-white border border-green-500/30 rounded-xl px-4 py-3 outline-none focus:border-green-400"
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading}
              className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}