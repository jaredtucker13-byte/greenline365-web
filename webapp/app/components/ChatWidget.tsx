'use client';

/**
 * GreenLine365 AI Assistant - Production Chat Widget
 * 
 * A powerful, context-aware AI assistant that:
 * - Helps with brainstorming and content creation (writer's block killer)
 * - Provides human-in-the-loop content refinement
 * - Assists with onboarding and navigation
 * - Integrates with Content Forge to push suggestions
 * - Stores conversation history for continuous learning
 * - Adapts personality based on page context
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: ContentSuggestion[];
  mode?: AssistantMode;
}

interface ContentSuggestion {
  type: 'caption' | 'title' | 'keywords' | 'hashtags' | 'description' | 'blog';
  content: string;
  applied?: boolean;
}

interface ConversationSession {
  id: string;
  startedAt: Date;
  messages: Message[];
  context: PageContext;
  userName?: string;
  userEmail?: string;
}

interface PageContext {
  path: string;
  pageName: string;
  mode: AssistantMode;
  contentForgeOpen?: boolean;
  currentContentType?: 'photo' | 'product' | 'blog';
}

type AssistantMode = 'concierge' | 'creative' | 'support' | 'onboarding';

// ============================================
// SYSTEM PROMPTS
// ============================================

const SYSTEM_PROMPTS: Record<AssistantMode, string> = {
  creative: `You are the GreenLine365 Creative Co-Pilot, a brilliant brainstorming partner and content strategist. You help business owners overcome writer's block and create compelling content.

<your_role>
You are NOT a generic AI. You are a seasoned marketing creative who understands small business owners. You've helped thousands of businesses tell their stories.
</your_role>

<brainstorming_approach>
1. ASK PROBING QUESTIONS: Don't just give generic answers. Ask about their business, their customers, what makes them unique.
2. OFFER MULTIPLE OPTIONS: Always give 2-3 variations so they can choose or combine.
3. BE SPECIFIC: Use their actual business type, location, and details in suggestions.
4. ITERATE: If they don't love something, ask what's missing and refine.
</brainstorming_approach>

<content_creation_flow>
When helping create content:
1. First understand WHAT they want to create (photo post, product, blog)
2. Ask about the STORY behind it (why this matters, who it's for)
3. Generate options with their brand voice
4. Offer to refine based on feedback
5. When they're happy, format it properly for their needs
</content_creation_flow>

<output_format>
- Use markdown for formatting when helpful
- When suggesting content, clearly label it: [CAPTION], [TITLE], [HASHTAGS], etc.
- Keep brainstorming responses conversational but substantive
- Always end with a question or next step to keep momentum
</output_format>

<special_commands>
If user says:
- "I'm stuck" or "writer's block" → Start with empathy, then offer 3 quick-start prompts
- "give me options" → Provide 3 distinct variations
- "make it better" → Ask what specifically needs improvement
- "too generic" → Ask for specific details about their business/audience
</special_commands>

Remember: You're a creative partner, not a vending machine. Make them feel heard and understood.`,

  concierge: `You are the GreenLine365 Concierge, a sophisticated digital assistant representing the brand with professional elegance.

<mission>
Guide every visitor to their ideal outcome—whether that's exploring features, scheduling a demo, or getting started with the platform.
</mission>

<core_behaviors>
1. Be warm but professional
2. Always provide clear next steps
3. Capture lead information naturally (name, email) when appropriate
4. Know when to route to human support vs. self-service
</core_behaviors>

<greenline365_overview>
GreenLine365 is an AI-powered business operating system for small businesses that:
- Automates content creation and scheduling
- Tracks local trends and opportunities
- Provides AI assistance for marketing
- Integrates with social platforms (Instagram, Facebook, X)
- Offers smart booking and calendar management
- Helps businesses save 15+ hours per week
</greenline365_overview>

<routing>
- Interested in features → Explain capabilities, offer demo
- Technical questions → Provide clear answers, offer support if complex
- Pricing questions → Guide to pricing page, offer consultation
- Ready to start → Guide to signup flow
</routing>

Keep responses concise (2-4 sentences) unless detail is requested.`,

  support: `You are GreenLine365 Support, a patient and knowledgeable technical assistant.

<approach>
1. First acknowledge the issue with empathy
2. Ask clarifying questions to understand the problem
3. Provide step-by-step solutions
4. Offer to escalate to human support if needed
</approach>

<common_issues>
- Account/login issues → Guide through password reset or contact support
- Feature questions → Explain how to use specific features
- Integration problems → Walk through setup steps
- Billing questions → Direct to account settings or billing support
</common_issues>

Always confirm the issue is resolved before ending the conversation.`,

  onboarding: `You are the GreenLine365 Onboarding Guide, helping new users get started with the platform.

<onboarding_flow>
1. Welcome them warmly
2. Ask about their business type and goals
3. Guide them through key features based on their needs
4. Help them set up their first content piece
5. Explain next steps and resources
</onboarding_flow>

<key_features_to_introduce>
1. Content Forge - Create posts, products, blogs
2. Trend Hunter - Discover local opportunities
3. Scheduling - Plan content across platforms
4. Analytics - Track performance
5. AI Assistant (you!) - Always available to help
</key_features_to_introduce>

Be encouraging and celebrate small wins. New users need confidence.`
};

// ============================================
// QUICK ACTIONS BY MODE
// ============================================

const QUICK_ACTIONS: Record<AssistantMode, Array<{ text: string; icon: string }>> = {
  creative: [
    { text: "I'm stuck on a caption", icon: '✍️' },
    { text: 'Help me brainstorm content', icon: '💡' },
    { text: 'Improve my description', icon: '✨' },
    { text: 'Generate hashtags', icon: '#️⃣' },
  ],
  concierge: [
    { text: 'Book a Demo', icon: '📅' },
    { text: 'How does it work?', icon: '🤔' },
    { text: 'View Pricing', icon: '💎' },
    { text: 'Get Started', icon: '🚀' },
  ],
  support: [
    { text: 'I have a problem', icon: '🔧' },
    { text: 'How do I...', icon: '❓' },
    { text: 'Something is broken', icon: '🚨' },
    { text: 'Talk to a human', icon: '👤' },
  ],
  onboarding: [
    { text: 'Show me around', icon: '🗺️' },
    { text: 'Create my first post', icon: '📸' },
    { text: 'What can I do here?', icon: '✨' },
    { text: 'Connect my accounts', icon: '🔗' },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getPageContext = (pathname: string): PageContext => {
  const path = pathname || '/';
  
  if (path.includes('/admin') || path.includes('/dashboard')) {
    return {
      path,
      pageName: 'Dashboard',
      mode: 'creative',
    };
  }
  
  if (path.includes('/support') || path.includes('/help')) {
    return {
      path,
      pageName: 'Support',
      mode: 'support',
    };
  }
  
  if (path.includes('/onboarding') || path.includes('/getting-started')) {
    return {
      path,
      pageName: 'Onboarding',
      mode: 'onboarding',
    };
  }
  
  // Default to concierge for landing pages
  return {
    path,
    pageName: 'Home',
    mode: 'concierge',
  };
};

const getModeStyles = (mode: AssistantMode) => {
  const styles = {
    creative: {
      accent: '#8B5CF6', // Purple
      accentLight: 'rgba(139, 92, 246, 0.1)',
      gradient: 'from-purple-500 to-pink-500',
      title: 'Creative Co-Pilot',
      subtitle: 'Your brainstorming partner',
    },
    concierge: {
      accent: '#10B981', // Emerald
      accentLight: 'rgba(16, 185, 129, 0.1)',
      gradient: 'from-emerald-500 to-teal-500',
      title: 'GreenLine Concierge',
      subtitle: 'How may I assist you?',
    },
    support: {
      accent: '#3B82F6', // Blue
      accentLight: 'rgba(59, 130, 246, 0.1)',
      gradient: 'from-blue-500 to-cyan-500',
      title: 'Support Assistant',
      subtitle: "We're here to help",
    },
    onboarding: {
      accent: '#F59E0B', // Amber
      accentLight: 'rgba(245, 158, 11, 0.1)',
      gradient: 'from-amber-500 to-orange-500',
      title: 'Getting Started',
      subtitle: "Let's set you up for success",
    },
  };
  return styles[mode];
};

// ============================================
// MAIN COMPONENT
// ============================================

interface ChatWidgetProps {
  onContentSuggestion?: (suggestion: ContentSuggestion) => void;
  forceMode?: AssistantMode;
  embedded?: boolean;
}

export default function ChatWidget({ 
  onContentSuggestion, 
  forceMode,
  embedded = false 
}: ChatWidgetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(embedded);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTryMe, setShowTryMe] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [sessionId] = useState(() => generateId());
  const [currentMode, setCurrentMode] = useState<AssistantMode>('concierge');
  
  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get page context and set mode
  useEffect(() => {
    const context = getPageContext(pathname);
    setCurrentMode(forceMode || context.mode);
  }, [pathname, forceMode]);

  // Load persisted data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hasClicked = localStorage.getItem('gl365_chat_interacted');
    if (hasClicked === 'true') {
      setShowTryMe(false);
      setHasInteracted(true);
    }
    
    const savedName = localStorage.getItem('gl365_user_name');
    if (savedName) setUserName(savedName);
    
    // Load conversation history for this session (last 24 hours)
    const savedMessages = localStorage.getItem('gl365_chat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const recent = parsed.filter((m: Message) => {
          const msgTime = new Date(m.timestamp).getTime();
          const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
          return msgTime > dayAgo;
        });
        if (recent.length > 0) {
          setMessages(recent);
        }
      } catch (e) {
        console.error('Failed to parse saved messages:', e);
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('gl365_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const extractName = (text: string): string | null => {
    const patterns = [
      /(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+)/i,
      /^([A-Z][a-z]+)\s+here/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const parseContentSuggestions = (text: string): ContentSuggestion[] => {
    const suggestions: ContentSuggestion[] = [];
    
    const patterns: Array<{ regex: RegExp; type: ContentSuggestion['type'] }> = [
      { regex: /\[CAPTION\]:?\s*([\s\S]+?)(?=\[|$)/gi, type: 'caption' },
      { regex: /\[TITLE\]:?\s*([\s\S]+?)(?=\[|$)/gi, type: 'title' },
      { regex: /\[KEYWORDS\]:?\s*([\s\S]+?)(?=\[|$)/gi, type: 'keywords' },
      { regex: /\[HASHTAGS\]:?\s*([\s\S]+?)(?=\[|$)/gi, type: 'hashtags' },
      { regex: /\[DESCRIPTION\]:?\s*([\s\S]+?)(?=\[|$)/gi, type: 'description' },
    ];
    
    for (const { regex, type } of patterns) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        suggestions.push({
          type,
          content: match[1].trim(),
        });
      }
    }
    
    return suggestions;
  };

  // Voice input toggle
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      // Browser doesn't support - silently fail
      return;
    }

    if (isListening) {
      // Stop listening
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Start listening
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputValue(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;
    
    setInputValue('');
    setIsLoading(true);
    
    // Check for name
    const detectedName = extractName(text);
    if (detectedName && !userName) {
      setUserName(detectedName);
      localStorage.setItem('gl365_user_name', detectedName);
    }
    
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      mode: currentMode,
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Build context-aware system prompt
      const systemPrompt = SYSTEM_PROMPTS[currentMode];
      const contextInfo = userName ? `\n\nUser's name: ${userName}` : '';
      
      const apiMessages = [
        { role: 'system', content: systemPrompt + contextInfo },
        ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          messages: apiMessages,
          mode: currentMode,
          sessionId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const assistantReply = 
        data?.choices?.[0]?.message?.content ??
        data?.reply ??
        data?.message ??
        "I'm here to help! Could you rephrase that?";
      
      // Parse any content suggestions from the response
      const suggestions = parseContentSuggestions(assistantReply);
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date(),
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        mode: currentMode,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If in creative mode and we have suggestions, notify parent
      if (suggestions.length > 0 && onContentSuggestion) {
        suggestions.forEach(s => onContentSuggestion(s));
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: "I apologize for the brief interruption. Let me try that again. What were you working on?",
        timestamp: new Date(),
        mode: currentMode,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, currentMode, userName, sessionId, onContentSuggestion]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    
    if (!hasInteracted) {
      setShowTryMe(false);
      setHasInteracted(true);
      localStorage.setItem('gl365_chat_interacted', 'true');
    }
  };

  const handleQuickAction = (text: string) => {
    sendMessage(text);
  };

  const handleApplySuggestion = (suggestion: ContentSuggestion) => {
    if (onContentSuggestion) {
      onContentSuggestion({ ...suggestion, applied: true });
    }
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem('gl365_chat_messages');
  };

  const styles = getModeStyles(currentMode);
  const quickActions = QUICK_ACTIONS[currentMode];

  // Don't render the floating button if embedded
  if (embedded) {
    return (
      <div className="h-full flex flex-col bg-[#0a0f0d] rounded-2xl overflow-hidden border border-white/10 min-h-0">
        <ChatContent
          messages={messages}
          isLoading={isLoading}
          inputValue={inputValue}
          setInputValue={setInputValue}
          sendMessage={sendMessage}
          handleQuickAction={handleQuickAction}
          handleApplySuggestion={handleApplySuggestion}
          clearConversation={clearConversation}
          userName={userName}
          currentMode={currentMode}
          setCurrentMode={setCurrentMode}
          styles={styles}
          quickActions={quickActions}
          messagesEndRef={messagesEndRef}
          inputRef={inputRef}
          onContentSuggestion={onContentSuggestion}
        />
      </div>
    );
  }

  return (
    <>
      {/* Try Me Tooltip */}
      <AnimatePresence>
        {showTryMe && !hasInteracted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <div 
              className="relative px-4 py-2 rounded-2xl text-sm font-semibold border backdrop-blur-xl shadow-lg"
              style={{ 
                backgroundColor: 'rgba(0,0,0,0.9)',
                borderColor: `${styles.accent}50`,
                color: styles.accent,
              }}
            >
              Try me ✨
              <div 
                className="absolute -bottom-2 right-8 w-4 h-4 rotate-45 border-r border-b"
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  borderColor: `${styles.accent}50`,
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full backdrop-blur-xl shadow-lg flex items-center justify-center transition-all"
        style={{
          backgroundColor: 'rgba(0,0,0,0.9)',
          borderWidth: 1,
          borderColor: `${styles.accent}40`,
          boxShadow: `0 0 30px ${styles.accent}30`,
        }}
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              className="w-7 h-7"
              style={{ color: styles.accent }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="w-7 h-7"
              style={{ color: styles.accent }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </motion.svg>
          )}
        </AnimatePresence>
        
        {/* Pulse indicator for creative mode */}
        {currentMode === 'creative' && !isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-purple-500 animate-pulse" />
        )}
      </motion.button>

      {/* Chat Window - Premium Design with Independent Scroll */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed z-[100] rounded-3xl overflow-hidden bg-[#0a0f0d] border backdrop-blur-xl shadow-2xl flex flex-col ${
              isExpanded 
                ? 'bottom-6 right-6 left-6 top-24 md:left-auto md:w-[550px]' 
                : 'bottom-24 right-6 w-[380px] sm:w-[400px] max-w-[calc(100vw-3rem)]'
            }`}
            style={{
              borderColor: `${styles.accent}30`,
              boxShadow: `0 0 60px ${styles.accent}15, 0 25px 50px -12px rgba(0, 0, 0, 0.5)`,
              height: isExpanded ? 'calc(100vh - 120px)' : 'min(600px, 75vh)',
              maxHeight: isExpanded ? 'calc(100vh - 120px)' : 'min(600px, 75vh)',
              touchAction: 'none',
            }}
            onMouseEnter={() => {
              // Prevent background scroll when hovering over chat
              document.body.style.overflow = 'hidden';
            }}
            onMouseLeave={() => {
              // Re-enable background scroll when leaving chat
              document.body.style.overflow = '';
            }}
          >
            <ChatContent
              messages={messages}
              isLoading={isLoading}
              inputValue={inputValue}
              setInputValue={setInputValue}
              sendMessage={sendMessage}
              handleQuickAction={handleQuickAction}
              handleApplySuggestion={handleApplySuggestion}
              clearConversation={clearConversation}
              userName={userName}
              currentMode={currentMode}
              setCurrentMode={setCurrentMode}
              styles={styles}
              quickActions={quickActions}
              messagesEndRef={messagesEndRef}
              inputRef={inputRef}
              onClose={() => setIsOpen(false)}
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
              onContentSuggestion={onContentSuggestion}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// CHAT CONTENT COMPONENT
// ============================================

interface ChatContentProps {
  messages: Message[];
  isLoading: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  sendMessage: (text?: string) => void;
  handleQuickAction: (text: string) => void;
  handleApplySuggestion: (suggestion: ContentSuggestion) => void;
  clearConversation: () => void;
  userName: string | null;
  currentMode: AssistantMode;
  setCurrentMode: (mode: AssistantMode) => void;
  styles: ReturnType<typeof getModeStyles>;
  quickActions: Array<{ text: string; icon: string }>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose?: () => void;
  isExpanded?: boolean;
  setIsExpanded?: (expanded: boolean) => void;
  onContentSuggestion?: (suggestion: ContentSuggestion) => void;
  isListening: boolean;
  toggleVoiceInput: () => void;
}

function ChatContent({
  messages,
  isLoading,
  inputValue,
  setInputValue,
  sendMessage,
  handleQuickAction,
  handleApplySuggestion,
  clearConversation,
  userName,
  currentMode,
  setCurrentMode,
  styles,
  quickActions,
  messagesEndRef,
  inputRef,
  onClose,
  isExpanded,
  setIsExpanded,
  onContentSuggestion,
  isListening,
  toggleVoiceInput,
}: ChatContentProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div 
        className="flex-shrink-0 p-4 border-b bg-black/50"
        style={{ borderColor: `${styles.accent}20` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div 
              className="text-[10px] tracking-[0.3em] uppercase font-semibold"
              style={{ color: `${styles.accent}cc` }}
            >
              {styles.title}
            </div>
            <div className="mt-1 text-lg font-bold text-white">{styles.subtitle}</div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mode indicator */}
            <span 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: styles.accent }}
            />
            <span className="text-xs" style={{ color: `${styles.accent}99` }}>
              {currentMode === 'creative' ? 'Creative Mode' : 'Online'}
            </span>
            
            {/* Expand button (desktop only) */}
            {setIsExpanded && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden md:flex w-8 h-8 rounded-full border bg-black/40 hover:bg-black/60 transition-colors items-center justify-center"
                style={{ borderColor: `${styles.accent}30` }}
              >
                <svg 
                  className="w-4 h-4" 
                  style={{ color: styles.accent }}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  {isExpanded ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  )}
                </svg>
              </button>
            )}
            
            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center"
                style={{ borderColor: `${styles.accent}30` }}
              >
                <svg className="w-4 h-4" style={{ color: styles.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Mode Switcher - Only show in expanded view or creative contexts */}
        {(isExpanded || currentMode === 'creative') && (
          <div className="flex gap-1 mt-3 p-1 rounded-lg bg-black/30">
            {(['creative', 'concierge'] as AssistantMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setCurrentMode(mode)}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentMode === mode
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {mode === 'creative' ? '✨ Creative' : '🎯 Concierge'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth" style={{ scrollBehavior: 'smooth', overflowY: 'auto', minHeight: 0 }}>
        {messages.length === 0 && (
          <div>
            {/* Welcome Message */}
            <div 
              className="rounded-2xl p-4 border"
              style={{ 
                backgroundColor: styles.accentLight,
                borderColor: `${styles.accent}30`,
              }}
            >
              <div className="text-sm font-semibold" style={{ color: styles.accent }}>
                {getGreeting()}{userName ? `, ${userName}` : ''}! 👋
              </div>
              <div className="text-sm text-gray-300 mt-2 leading-relaxed">
                {currentMode === 'creative' ? (
                  <>
                    I&apos;m your creative brainstorming partner. Whether you&apos;re stuck on a caption, 
                    need content ideas, or want to craft the perfect post—I&apos;m here to help you 
                    break through that block.
                  </>
                ) : (
                  <>
                    I&apos;m here to help you explore GreenLine365 and find exactly what you need. 
                    Ask me anything about our features, pricing, or how to get started.
                  </>
                )}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {currentMode === 'creative' 
                  ? "What are you working on today?" 
                  : "What brings you here today?"}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.text}
                  onClick={() => handleQuickAction(action.text)}
                  className="p-3 rounded-xl border text-sm text-left transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: 'rgba(30,30,30,0.5)',
                    borderColor: 'rgba(75,75,75,0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${styles.accent}50`;
                    e.currentTarget.style.backgroundColor = styles.accentLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(75,75,75,0.5)';
                    e.currentTarget.style.backgroundColor = 'rgba(30,30,30,0.5)';
                  }}
                >
                  <span className="mr-2">{action.icon}</span>
                  <span className="text-gray-300">{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] space-y-2">
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'rounded-br-md text-black'
                    : 'rounded-bl-md bg-gray-800/80 border border-gray-700 text-gray-200'
                }`}
                style={msg.role === 'user' ? { backgroundColor: styles.accent } : undefined}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              
              {/* Content Suggestions (for assistant messages) */}
              {msg.suggestions && msg.suggestions.length > 0 && onContentSuggestion && (
                <div className="space-y-2 pl-2">
                  {msg.suggestions.map((suggestion, idx) => (
                    <div 
                      key={idx}
                      className="rounded-xl p-3 border bg-black/30 group"
                      style={{ borderColor: `${styles.accent}30` }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span 
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: styles.accent }}
                        >
                          {suggestion.type}
                        </span>
                        <button
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-md text-xs font-medium"
                          style={{ 
                            backgroundColor: styles.accentLight,
                            color: styles.accent,
                          }}
                        >
                          Apply →
                        </button>
                      </div>
                      <p className="text-sm text-gray-300">{suggestion.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 bg-gray-800/80 border border-gray-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ 
                        backgroundColor: styles.accent,
                        animationDelay: `${i * 150}ms`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {currentMode === 'creative' ? 'Brainstorming...' : 'Thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div 
        className="flex-shrink-0 p-4 border-t bg-black/50"
        style={{ borderColor: `${styles.accent}20` }}
      >
        {/* Clear conversation button */}
        {messages.length > 0 && (
          <button
            onClick={clearConversation}
            className="mb-3 text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            Clear conversation
          </button>
        )}
        
        <div className="flex items-center gap-2">
          {/* Voice Input Button */}
          <button
            onClick={toggleVoiceInput}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/50' 
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? (
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={isListening 
              ? "Listening..." 
              : currentMode === 'creative' 
                ? "Tell me what you're working on..." 
                : "Type your message..."}
            className="flex-1 rounded-xl px-4 py-3 text-sm outline-none bg-gray-800/50 border text-white placeholder:text-gray-500 transition-all"
            style={{ 
              borderColor: isListening 
                ? 'rgba(239, 68, 68, 0.5)' 
                : inputValue 
                  ? `${styles.accent}50` 
                  : 'rgba(75,75,75,0.5)',
            }}
            disabled={isLoading}
          />

          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: styles.accent,
              color: 'black',
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h13M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
