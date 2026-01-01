'use client';

import { useState } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        @keyframes waveShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
          50% { box-shadow: 0 0 0 20px rgba(74, 222, 128, 0); }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .chat-button {
          animation: float 4s ease-in-out infinite, pulse 3s ease-in-out infinite;
          background: linear-gradient(
            135deg,
            #4ade80 0%,
            #22c55e 25%,
            #86efac 50%,
            #22c55e 75%,
            #4ade80 100%
          );
          background-size: 400% 400%;
          animation: float 4s ease-in-out infinite, pulse 3s ease-in-out infinite, waveShimmer 6s linear infinite;
        }

        .chat-button:hover {
          transform: scale(1.15) translateY(-4px);
        }

        .chat-window {
          animation: fadeSlideUp 0.4s ease-out;
        }

        .message-fade {
          animation: fadeSlideUp 0.3s ease-out;
        }
      `}</style>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chat-button fixed bottom-6 right-6 w-20 h-20 rounded-full shadow-2xl hover:scale-110 transition-all duration-500 z-50 flex items-center justify-center text-4xl"
          aria-label="Open chat"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="chat-window fixed bottom-6 right-6 w-[400px] h-[600px] bg-[#0a1a1a] rounded-3xl shadow-2xl flex flex-col z-50 border border-green-500/30 overflow-hidden">
          
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#1a2f1a] via-[#0f1f0f] to-[#0a1a1a] p-6 border-b border-green-500/20">
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all"
              aria-label="Close chat"
            >
              ×
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Instant Assistant</h3>
                <p className="text-green-400 text-sm">Aiden • Online now</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0a1a1a]">
            {messages.length === 0 && (
              <div className="text-center mt-16 space-y-4">
                <div className="text-gray-400 text-sm leading-relaxed px-4">
                  Have a specific question about your business niche?<br/>
                  Ask our ecosystem intelligence for an instant strategic answer.
                </div>
                <div className="text-green-400/60 text-xs px-6">
                  e.g. "How would this work for a landscaping business?"
                </div>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`message-fade ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'} max-w-[85%]`}
              >
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-sm shadow-lg' 
                    : 'bg-[#1a2f1a] text-gray-100 rounded-bl-sm border border-green-500/20'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mr-auto max-w-[85%]">
                <div className="bg-[#1a2f1a] p-4 rounded-2xl rounded-bl-sm border border-green-500/20">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#0f1f0f] border-t border-green-500/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                placeholder="Type your question..."
                className="flex-1 bg-[#1a2f1a] text-white border border-green-500/30 rounded-xl px-4 py-3 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400/20 transition-all placeholder-gray-500"
                disabled={isLoading}
              />
              <button 
                onClick={sendMessage} 
                disabled={isLoading || !message.trim()}
                className="bg-gradient-to-br from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-green-500/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}