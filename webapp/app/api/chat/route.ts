import { NextRequest } from 'next/server';
import { createClient, createServerClient } from '@/lib/supabase/server';
import { MemoryBucketService, AIContext } from '@/lib/memory-bucket-service';

type Msg = { role: 'user' | 'assistant' | 'system'; content: string };

// ========================================
// BOOKING INTENT DETECTION
// ========================================

interface BookingIntent {
  type: 'schedule' | 'availability' | 'confirm';
  date?: string;
  time?: string;
  name?: string;
  email?: string;
  phone?: string;
}

function detectBookingIntent(message: string, history: Msg[]): BookingIntent | null {
  const lower = message.toLowerCase();
  const fullConvo = history.map(m => m.content.toLowerCase()).join(' ');
  
  // Check if this is a booking-related conversation
  const bookingKeywords = ['book', 'schedule', 'demo', 'appointment', 'meeting', 'call', 'consultation'];
  const hasBookingIntent = bookingKeywords.some(kw => lower.includes(kw)) || 
                           bookingKeywords.some(kw => fullConvo.includes(kw));
  
  if (!hasBookingIntent) return null;
  
  // Try to extract date
  const datePatterns = [
    /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i,
    /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/,
    /\b(next\s+week|this\s+week)\b/i
  ];
  
  let extractedDate: string | undefined;
  for (const pattern of datePatterns) {
    const match = message.match(pattern) || fullConvo.match(pattern);
    if (match) {
      extractedDate = match[0];
      break;
    }
  }
  
  // Try to extract time
  const timePattern = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/;
  const timeMatch = message.match(timePattern) || fullConvo.match(timePattern);
  const extractedTime = timeMatch ? timeMatch[0] : undefined;
  
  // Try to extract email
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/;
  const emailMatch = message.match(emailPattern) || fullConvo.match(emailPattern);
  const extractedEmail = emailMatch ? emailMatch[0] : undefined;
  
  // Try to extract phone
  const phonePattern = /(?:\+1)?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
  const phoneMatch = message.match(phonePattern) || fullConvo.match(phonePattern);
  const extractedPhone = phoneMatch ? phoneMatch[0] : undefined;
  
  // Determine intent type
  if (lower.includes('available') || lower.includes('availability') || lower.includes('what time')) {
    return { type: 'availability', date: extractedDate };
  }
  
  if (extractedDate && extractedTime) {
    return { 
      type: 'confirm', 
      date: extractedDate, 
      time: extractedTime,
      email: extractedEmail,
      phone: extractedPhone
    };
  }
  
  return { type: 'schedule', date: extractedDate, time: extractedTime };
}

async function handleBookingIntent(intent: BookingIntent, message: string, history: Msg[]): Promise<string | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    if (intent.type === 'availability' && intent.date) {
      // Check availability via MCP
      const response = await fetch(`${baseUrl}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'check_availability',
          args: { date: parseUserDate(intent.date) }
        })
      });
      
      const result = await response.json();
      return result.result || result.message;
    }
    
    if (intent.type === 'confirm' && intent.date && intent.time) {
      // Extract name from conversation
      const namePattern = /(?:my name is|i'm|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
      const convoText = history.map(m => m.content).join(' ');
      const nameMatch = convoText.match(namePattern);
      const customerName = nameMatch ? nameMatch[1] : 'Guest';
      
      // Create booking via MCP
      const response = await fetch(`${baseUrl}/api/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'create_booking',
          args: {
            customer_name: customerName,
            customer_email: intent.email || `demo-${Date.now()}@greenline365.com`,
            customer_phone: intent.phone || '',
            preferred_date: parseUserDate(intent.date),
            preferred_time: parseUserTime(intent.time),
            service_type: 'Demo Call',
            notes: 'Booked via Concierge Chat'
          }
        })
      });
      
      const result = await response.json();
      return result.result || result.message;
    }
    
    // For general schedule intent, return null to let AI handle the conversation
    return null;
    
  } catch (error) {
    console.error('[Chat] Booking intent error:', error);
    return null;
  }
}

function parseUserDate(dateStr: string): string {
  const lower = dateStr.toLowerCase();
  const today = new Date();
  
  if (lower === 'today') {
    return today.toISOString().split('T')[0];
  }
  
  if (lower === 'tomorrow') {
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  }
  
  // Handle day names
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = days.findIndex(d => lower.includes(d));
  if (dayIndex !== -1) {
    const currentDay = today.getDay();
    let daysUntil = dayIndex - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    if (lower.includes('next')) daysUntil += 7;
    today.setDate(today.getDate() + daysUntil);
    return today.toISOString().split('T')[0];
  }
  
  // Try parsing as-is
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  } catch {}
  
  // Default to next available weekday
  today.setDate(today.getDate() + 1);
  while (today.getDay() === 0 || today.getDay() === 6) {
    today.setDate(today.getDate() + 1);
  }
  return today.toISOString().split('T')[0];
}

function parseUserTime(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return '10:00';
  
  let hours = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const period = match[3]?.toLowerCase();
  
  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Model selection based on mode
const getModel = (mode?: string): string => {
  switch (mode) {
    case 'creative':
      return 'anthropic/claude-3.5-sonnet';
    case 'support':
      return 'openai/gpt-4o-mini';
    default:
      return 'openai/gpt-4o-mini';
  }
};

// ========================================
// DIRECTORY SEARCH FOR CHAT
// ========================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function searchDirectory(query: string): Promise<string> {
  const { createClient: createSupabase } = await import('@supabase/supabase-js');
  const supabase = createSupabase(supabaseUrl, supabaseServiceKey);

  // Detect intent from the query
  const lower = query.toLowerCase();
  const categories = ['dining', 'services', 'health-wellness', 'nightlife', 'style-shopping', 'family-entertainment', 'hotels-lodging', 'professional-services', 'destinations'];
  const categoryMap: Record<string, string> = {
    'restaurant': 'dining', 'food': 'dining', 'eat': 'dining', 'dinner': 'dining', 'lunch': 'dining', 'breakfast': 'dining', 'cafe': 'dining', 'bakery': 'dining',
    'plumber': 'services', 'plumbing': 'services', 'roofer': 'services', 'roofing': 'services', 'hvac': 'services', 'ac': 'services', 'electrician': 'services', 'electrical': 'services', 'contractor': 'services', 'landscap': 'services', 'pest': 'services', 'cleaning': 'services',
    'doctor': 'health-wellness', 'dentist': 'health-wellness', 'gym': 'health-wellness', 'spa': 'health-wellness', 'clinic': 'health-wellness', 'wellness': 'health-wellness', 'fitness': 'health-wellness',
    'bar': 'nightlife', 'club': 'nightlife', 'lounge': 'nightlife', 'nightlife': 'nightlife', 'music': 'nightlife',
    'salon': 'style-shopping', 'barber': 'style-shopping', 'boutique': 'style-shopping', 'shop': 'style-shopping',
    'hotel': 'hotels-lodging', 'resort': 'hotels-lodging', 'stay': 'hotels-lodging', 'lodging': 'hotels-lodging',
    'lawyer': 'professional-services', 'attorney': 'professional-services', 'accountant': 'professional-services',
    'fun': 'family-entertainment', 'theme park': 'family-entertainment', 'arcade': 'family-entertainment', 'kids': 'family-entertainment',
  };

  let detectedCategory = '';
  for (const [keyword, cat] of Object.entries(categoryMap)) {
    if (lower.includes(keyword)) { detectedCategory = cat; break; }
  }

  // Detect city
  const cities = ['tampa', 'st pete', 'st. pete', 'key west', 'sarasota', 'daytona', 'orlando', 'miami', 'jacksonville', 'ybor'];
  let detectedCity = '';
  for (const city of cities) {
    if (lower.includes(city)) { detectedCity = city; break; }
  }

  // Build query
  let dbQuery = supabase
    .from('directory_listings')
    .select('business_name, slug, industry, city, state, phone, website, avg_feedback_rating, metadata')
    .order('avg_feedback_rating', { ascending: false })
    .limit(6);

  if (detectedCategory) dbQuery = dbQuery.eq('industry', detectedCategory);
  if (detectedCity) dbQuery = dbQuery.ilike('city', `%${detectedCity}%`);

  // If no category detected, try text search
  if (!detectedCategory && !detectedCity) {
    dbQuery = supabase
      .from('directory_listings')
      .select('business_name, slug, industry, city, state, phone, website, avg_feedback_rating, metadata')
      .or(`business_name.ilike.%${query}%,industry.ilike.%${query}%,description.ilike.%${query}%`)
      .order('avg_feedback_rating', { ascending: false })
      .limit(6);
  }

  const { data: listings } = await dbQuery;
  if (!listings || listings.length === 0) return '';

  const results = listings.map(l => {
    const rating = l.metadata?.google_rating || l.avg_feedback_rating || 0;
    const reviews = l.metadata?.google_review_count || 0;
    return `- **${l.business_name}** (${l.city}, ${l.state}) — ${l.industry.replace(/-/g, ' ')} | Rating: ${rating}/5 (${reviews} reviews) | Phone: ${l.phone || 'N/A'} | [View Listing](/listing/${l.slug})`;
  });

  return `\n\nDIRECTORY SEARCH RESULTS (${listings.length} found):\n${results.join('\n')}`;
}

function isDirectoryQuery(message: string): boolean {
  const keywords = ['find', 'looking for', 'where', 'recommend', 'best', 'near', 'close to', 'search', 'show me',
    'plumber', 'roofer', 'restaurant', 'hotel', 'bar', 'salon', 'dentist', 'electrician', 'hvac', 'gym',
    'directions', 'navigate', 'how do i get to', 'take me to',
    'claim', 'list my', 'add my business', 'pricing', 'tier', 'upgrade', 'how much'];
  const lower = message.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

// Build system prompt with brand voice from Memory Bucket Layer 1
function buildSystemPromptWithBrandVoice(context: AIContext | null, mode?: string): string {
  // Base prompts per mode
  const basePrompts: Record<string, string> = {
    creative: `You are a creative marketing assistant for a local business. 
You help brainstorm content ideas, write engaging copy, and suggest marketing strategies.
Be creative, enthusiastic, and provide multiple options when possible.`,
    support: `You are a helpful customer support assistant for GreenLine365.
Answer questions about features, help troubleshoot issues, and guide users through the platform.
Be clear, concise, and always offer to help further.`,
    default: `You are the GreenLine365 Directory Concierge — an intelligent assistant for a premium local business directory serving Florida.

YOUR CAPABILITIES:
- Search the directory for businesses by type, location, or name
- Provide directions and contact info for any listed business
- Help consumers find exactly what they need (restaurants, services, nightlife, etc.)
- Guide business owners on claiming listings, upgrading tiers, and managing their presence

DIRECTORY INFO:
- 540+ verified businesses across 9+ Florida destinations
- Categories: Services, Dining, Health & Wellness, Nightlife, Style & Shopping, Family Entertainment, Hotels, Professional Services, Destinations
- Tiers: Free (basic listing), Pro ($39/mo — verified badge, CTA buttons, 2 photos), Premium ($59/mo — featured placement, 10 photos, analytics)
- Destination guides: St. Pete Beach, Key West, Sarasota, Daytona Beach, Ybor City, Orlando, Miami, Jacksonville

WHEN USERS ASK TO FIND BUSINESSES:
- Use the directory search results provided in your context
- Always include the listing link: [Business Name](/listing/slug-here)
- Mention ratings, phone numbers, and location
- If they want directions, link to the listing page which has an embedded map

WHEN BUSINESS OWNERS ASK:
- Claiming: "Contact greenline365help@gmail.com to verify ownership and get your claim code"
- Pricing: Free/Pro($39)/Premium($59) — explain features at each tier
- Dashboard: Once claimed, manage at /business-dashboard

STYLE: Warm, concise (2-4 sentences unless detail needed), always actionable. End with a follow-up question or next step.`,
  };

  let systemPrompt = basePrompts[mode || 'default'] || basePrompts.default;

  // Inject brand voice from Layer 1 (Core Profile)
  if (context?.brandVoice) {
    const voice = context.brandVoice;
    systemPrompt += `

═══════════════════════════════════════════════════════════════
BRAND VOICE INSTRUCTIONS (Match this user's style)
═══════════════════════════════════════════════════════════════
`;
    if (voice.displayName) {
      systemPrompt += `- Speaking as/for: ${voice.displayName}`;
      if (voice.businessName) systemPrompt += ` (${voice.businessName})`;
      systemPrompt += '\n';
    }
    if (voice.location) {
      systemPrompt += `- Location context: ${voice.location}\n`;
    }
    if (voice.industry) {
      systemPrompt += `- Industry: ${voice.industry}\n`;
    }
    if (voice.personality) {
      systemPrompt += `- Tone: ${voice.personality.tone || 'friendly'}\n`;
      systemPrompt += `- Formality: ${voice.personality.formality || 'casual-professional'}\n`;
      systemPrompt += `- Energy: ${voice.personality.energy || 'balanced'}\n`;
      if (voice.personality.quirks?.length) {
        systemPrompt += `- Style quirks: ${voice.personality.quirks.join(', ')}\n`;
      }
    }
    if (voice.preferredPhrases?.length) {
      systemPrompt += `- Preferred phrases to use: "${voice.preferredPhrases.slice(0, 3).join('", "')}"\n`;
    }
    if (voice.forbiddenPhrases?.length) {
      systemPrompt += `- NEVER say: "${voice.forbiddenPhrases.slice(0, 3).join('", "')}"\n`;
    }
    if (voice.voiceExamples?.length) {
      systemPrompt += `- Voice example: "${voice.voiceExamples[0]}"\n`;
    }
    if (voice.biography?.background) {
      systemPrompt += `- User background: ${voice.biography.background}\n`;
    }
  }

  // Add context from Layer 3 (Journal - Recent Events)
  if (context?.history?.length) {
    systemPrompt += `

═══════════════════════════════════════════════════════════════
RECENT ACTIVITY (What this user has done recently)
═══════════════════════════════════════════════════════════════
`;
    context.history.slice(0, 5).forEach(event => {
      const date = event.occurredAt.toLocaleDateString();
      systemPrompt += `- ${date}: ${event.eventType}${event.title ? ` - "${event.title}"` : ''}\n`;
    });
  }

  // Add relevant knowledge from Layer 2 (Warehouse)
  if (context?.factualBase?.length) {
    systemPrompt += `

═══════════════════════════════════════════════════════════════
BUSINESS KNOWLEDGE BASE
═══════════════════════════════════════════════════════════════
`;
    context.factualBase.slice(0, 3).forEach(chunk => {
      systemPrompt += `[${chunk.category}]: ${chunk.content.slice(0, 300)}${chunk.content.length > 300 ? '...' : ''}\n`;
    });
  }

  return systemPrompt;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    const message: string | undefined =
      body?.message ??
      body?.messages?.[body.messages.length - 1]?.content;

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Missing message' }, { status: 400 });
    }

    const messages: Msg[] = body?.messages?.length
      ? body.messages
      : [{ role: 'user', content: message }];

    const mode = body?.mode as string | undefined;
    const sessionId = body?.sessionId as string | undefined;
    const model = getModel(mode);

    // ========================================
    // BOOKING INTENT DETECTION & HANDLING
    // ========================================
    const bookingIntent = detectBookingIntent(message, messages);
    if (bookingIntent) {
      const bookingResponse = await handleBookingIntent(bookingIntent, message, messages);
      if (bookingResponse) {
        return Response.json({
          choices: [{
            message: {
              role: 'assistant',
              content: bookingResponse
            }
          }]
        });
      }
    }

    // ========================================
    // MEMORY BUCKET INTEGRATION
    // ========================================
    let aiContext: AIContext | null = null;
    let userId: string | null = null;

    try {
      // Try to get authenticated user
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && sessionId) {
        userId = user.id;
        
        // Create Memory Bucket Service
        const memoryService = new MemoryBucketService(supabase, userId);
        
        // Fetch AI context using Priority Fetch Order
        aiContext = await memoryService.prepareAIContext(sessionId, message);
        
        // Store user message in Buffer (Layer 4)
        await memoryService.addToBuffer(sessionId, {
          contextType: 'message',
          content: { role: 'user', content: message, timestamp: new Date().toISOString() },
          importance: 5,
        });
        
        console.log(`[Chat] Memory context loaded for user ${userId}`);
      }
    } catch (memoryError) {
      // Memory system is optional - continue without it
      console.warn('[Chat] Memory system unavailable:', memoryError);
    }

    // Build system prompt with brand voice injection
    const systemPrompt = buildSystemPromptWithBrandVoice(aiContext, mode);

    // Prepare messages with system prompt
    const messagesWithSystem: Msg[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system'), // Remove any existing system messages
    ];

    console.log(`[Chat] Session: ${sessionId || 'anonymous'}, Mode: ${mode || 'default'}, Model: ${model}, HasMemory: ${!!aiContext}`);

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com',
        'X-Title': 'GreenLine365 Assistant',
      },
      body: JSON.stringify({
        model,
        messages: messagesWithSystem,
        stream: false,
        temperature: mode === 'creative' ? 0.8 : 0.7,
        max_tokens: mode === 'creative' ? 1000 : 500,
      }),
    });

    const json = await upstream.json().catch(async () => ({
      error: await upstream.text(),
    }));

    // Handle rate limits or errors gracefully
    if (!upstream.ok) {
      console.error('[Chat] API Error:', json);
      return Response.json(
        { 
          error: 'Service temporarily unavailable',
          reply: "I'm experiencing a brief delay. Please try again in a moment."
        }, 
        { status: upstream.status }
      );
    }

    // Store assistant response in Buffer (Layer 4)
    if (userId && sessionId && json?.choices?.[0]?.message?.content) {
      try {
        const supabase = await createClient();
        const memoryService = new MemoryBucketService(supabase, userId);
        await memoryService.addToBuffer(sessionId, {
          contextType: 'message',
          content: { 
            role: 'assistant', 
            content: json.choices[0].message.content, 
            timestamp: new Date().toISOString() 
          },
          importance: 5,
        });
      } catch (e) {
        // Silently fail - don't break the response
        console.warn('[Chat] Failed to store assistant message:', e);
      }
    }

    return Response.json(json, { status: 200 });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Server error';
    console.error('[Chat] Server Error:', errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
