'use client';

import { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  onClose?: () => void;
}

export default function ChatWidget({ onClose }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTryMe, setShowTryMe] = useState(true);
  const [hasClicked, setHasClicked] = useState(false);

  // Check if user has clicked before (using localStorage)
  useEffect(() => {
    const clicked = localStorage.getItem('chatWidgetClicked');
    if (clicked === 'true') {
      setShowTryMe(false);
      setHasClicked(true);
    }
  }, []);

  const handleBubbleClick = () => {
    setIsOpen(!isOpen);
    if (!hasClicked) {
      setShowTryMe(false);
      setHasClicked(true);
      localStorage.setItem('chatWidgetClicked', 'true');
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Call YOUR backend at /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          userId: 'guest-' + Date.now()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply || data.message || 'I received your message!'
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* "Try me" cloud tooltip - floats above bubble */}
      {showTryMe && !hasClicked && (
        <div className="fixed bottom-24 right-6 z-50 animate-bounce">
          <div className="relative bg-white text-[#0a1a1a] px-4 py-2 rounded-2xl shadow-xl font-semibold text-sm whitespace-nowrap">
            Try me! 💬
            {/* Little pointer/tail pointing down to bubble */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Sticky floating bubble button */}
      <button
        onClick={handleBubbleClick}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-[#5DFECA] to-[#4ade80] rounded-full shadow-2xl shadow-[#5DFECA]/50 hover:scale-110 transition-transform flex items-center justify-center"
      >
        {isOpen ? (
          <svg className="w-8 h-8 text-[#0a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-[#0a1a1a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] bg-[#1a1b26] rounded-3xl shadow-2xl border-2 border-[#5DFECA]/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1f2335] to-[#24283b] p-5 border-b border-[#5DFECA]/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">GreenLine365 Assistant</h3>
                <p className="text-[#5DFECA] text-xs">Online • Ready to help</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-5 space-y-4 bg-[#1a1b26]">
            {messages.length === 0 && (
              <div className="text-center text-white/40 py-8">
                <p className="text-sm">Ask me anything about GreenLine365!</p>
                <p className="text-xs mt-2">Try: "How would this work for a barbershop in Windermere?"</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-[#5DFECA] to-[#4ade80] text-[#0a1a1a] rounded-br-sm'
                    : 'bg-[#24283b] text-white rounded-bl-sm border border-[#5DFECA]/10'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
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
