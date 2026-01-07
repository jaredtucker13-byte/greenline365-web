'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatwidgetProps {
  onClose?: () => void;
  clientName?: string;
}

const SYSTEM_PROMPT = `You are the GreenLine365 Concierge, a high-end digital concierge from a future where service is frictionless and proactive. You represent the brand with professional elegance and never identify as an AI.

<mission_motivation>
Your primary objective is to maximize user satisfaction and business ROI by acting as a Master Intent Router. You exist to ensure every visitor is guided to their ideal outcome—whether that is a new sale, a resolved issue, or a completed payment—with zero wasted effort.
</mission_motivation>

<core_directives>
1. Lead Capture Protocol: Whenever a user expresses interest in services, always transition naturally to asking for their Name and Email Address. Frame this as "opening a priority file" or "preparing a personalized brief" to maintain the concierge persona.

2. Positive Behavioral Framing:
   - Always maintain the persona of a senior human concierge.
   - Always provide clear next steps after every interaction.
   - Always use the user's name once it is captured to personalize the journey.

3. Proactive Problem Solving: If a user seems hesitant, offer to schedule a brief discovery call to reduce friction.
</core_directives>

<routing_logic>
Analyze user intent and trigger the appropriate Master Flow immediately:

• Booking Intent: (e.g., "I want an appointment," "Can I see you today?") → Offer to help them schedule using our booking system. Mention they can use the booking form on this page.

• Service/Support Issues: (e.g., "It's broken," "I have a question") → Route the user to Customer Service with an empathetic transition.

• Transaction Intent: (e.g., "I want to pay my bill," "How much?") → Guide them to pricing or payment options.

• General Interest: When users ask about services, explain GreenLine365 offers:
  - AI-powered business planning and accountability
  - Smart scheduling and calendar integration  
  - Embeddable booking widgets for businesses
  - AI chat widgets for customer service automation
</routing_logic>

<output_format>
• Keep responses concise and professional (2-4 sentences max unless detailed explanation requested)
• Maintain a helpful, proactive, and sophisticated tone
• Always end with a clear next step or question
• Use the user's name when known
</output_format>

Remember: You are a sophisticated concierge, not a chatbot. Speak with confidence and authority.`;

export default function ChatWidget({ onClose, clientName = 'GreenLine365' }: ChatwidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTryMe, setShowTryMe] = useState(true);
  const [hasClicked, setHasClicked] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
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
    const savedName = localStorage.getItem('chatUserName');
    if (savedName) setUserName(savedName);
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

  // Extract name from conversation if mentioned
  const extractName = (text: string): string | null => {
    const patterns = [
      /(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+)/i,
      /^([A-Z][a-z]+)\s+here/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const sendMessage = async () => {
    if (isLoading || !message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // Check if user mentioned their name
    const detectedName = extractName(userMessage);
    if (detectedName && !userName) {
      setUserName(detectedName);
      localStorage.setItem('chatUserName', detectedName);
    }

    const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);

    try {
      // Build messages array with system prompt
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          messages: apiMessages,
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
        'I apologize, but I encountered a brief interruption. How may I assist you?';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantReply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize for the interruption. Our systems are experiencing a brief delay. Please try again in a moment, or use the booking form on this page to schedule a consultation.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      {showTryMe && !hasClicked && (
        <div className="fixed bottom-24 right-6 z-50">
          <div className="relative px-4 py-2 rounded-2xl text-sm font-semibold bg-black/90 text-emerald-100 border border-emerald-500/30 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.18)]">
            Try me
            <div className="absolute -bottom-2 right-8 w-4 h-4 rotate-45 bg-black/90 border-r border-b border-emerald-500/30" />
          </div>
        </div>
      )}

      <button
        onClick={handleBubbleClick}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-black/90 border border-emerald-500/30 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.18)] hover:scale-110 transition-transform flex items-center justify-center"
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
        <div className="fixed bottom-24 right-6 z-40 w-[360px] sm:w-[400px] max-w-[calc(100vw-3rem)] rounded-3xl overflow-hidden bg-[#0a0f0d] border border-emerald-500/20 backdrop-blur-xl shadow-[0_0_70px_rgba(16,185,129,0.14)]">
          
          {/* Header */}
          <div className="p-5 border-b border-emerald-500/10 bg-black/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] tracking-[0.35em] uppercase font-semibold text-emerald-400/80">
                  {clientName.toUpperCase()} CONCIERGE
                </div>
                <div className="mt-1 text-xl font-bold text-white">How may I assist you?</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400/70">Online</span>

                <button
                  onClick={closeWidget}
                  className="ml-2 w-8 h-8 rounded-full border border-emerald-500/20 bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center"
                  type="button"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[350px] overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 && (
              <div>
                <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/20 text-white">
                  <div className="text-sm font-semibold text-emerald-300">{getGreeting()}{userName ? `, ${userName}` : ''}.</div>
                  <div className="text-sm text-gray-300 mt-1 leading-relaxed">
                    I&apos;m your personal concierge at {clientName}. Whether you&apos;re looking to schedule a consultation, explore our services, or need assistance with anything else—I&apos;m here to help.
                  </div>
                  <div className="text-sm text-gray-300 mt-2">
                    What brings you here today?
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { text: 'Book a Demo', icon: '📅' },
                    { text: 'View Services', icon: '✨' },
                    { text: 'Get Pricing', icon: '💎' },
                    { text: 'Need Support', icon: '🤝' },
                  ].map((action) => (
                    <button
                      key={action.text}
                      onClick={() => {
                        setMessage(action.text);
                        setTimeout(() => sendMessage(), 100);
                      }}
                      className="p-3 rounded-xl bg-gray-800/50 border border-gray-700 text-sm text-gray-300 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition text-left"
                    >
                      <span className="mr-2">{action.icon}</span>
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'rounded-br-md bg-emerald-500 text-black'
                      : 'rounded-bl-md bg-gray-800/80 border border-gray-700 text-gray-200'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 bg-gray-800/80 border border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-emerald-500/10 bg-black/50">
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
                placeholder="Type your message..."
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none bg-gray-800/50 border border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                disabled={isLoading}
              />

              <button
                onClick={sendMessage}
                disabled={isLoading || !message.trim()}
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                type="button"
                aria-label="Send"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h13M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
