'use client';

import { useState } from 'react';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');

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
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes waveShimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(74, 222, 128, 0);
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
          position: relative;
          overflow: hidden;
        }

        .chat-button::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 70%
          );
          animation: waveShimmer 4.5s linear infinite;
        }

        .chat-button:hover {
          transform: scale(1.15) translateY(-4px);
          animation: float 2s ease-in-out infinite, pulse 1.5s ease-in-out infinite, waveShimmer 4s linear infinite;
        }

        .chat-header {
          background: linear-gradient(
            135deg,
            #4ade80 0%,
            #22c55e 50%,
            #16a34a 100%
          );
          background-size: 200% 200%;
          animation: waveShimmer 8s ease-in-out infinite;
        }

        .fade-in {
          animation: fadeIn 0.4s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .message-user {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
          color: white;
        }

        .message-assistant {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          color: #1f2937;
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
        <div className="fade-in fixed bottom-6 right-6 w-96 h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-green-200">
          <div className="chat-header p-5 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-lg">GreenLine365 Chat</h3>
              <p className="text-white/90 text-sm">Aiden • Online</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-white text-3xl hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-all"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-20">
                <p className="text-lg">👋 Hi! I'm Aiden</p>
                <p className="text-sm mt-2">How can I help automate your business?</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`fade-in p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'message-user ml-auto shadow-md' 
                    : 'message-assistant shadow-sm'
                } max-w-[85%] ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-400 focus:outline-none transition-colors"
            />
            <button 
              onClick={sendMessage} 
              className="bg-gradient-to-br from-green-400 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-500 hover:to-green-700 transition-all shadow-md hover:shadow-lg font-medium"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}