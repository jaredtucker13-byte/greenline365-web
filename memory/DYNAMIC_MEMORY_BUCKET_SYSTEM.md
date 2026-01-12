# Dynamic Memory Bucket System

> **The "Brain" of GreenLine365** - A 4-layer hierarchy that ensures the AI doesn't just guess; it knows exactly who you are, what you've done, and how your business works.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI RESPONSE GENERATION                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 PRIORITY FETCH ORDER                      │   │
│  │                                                           │   │
│  │   1️⃣ Layer 4: Buffer    → What is user doing RIGHT NOW?  │   │
│  │   2️⃣ Layer 1: Core      → How should I SOUND?            │   │
│  │   3️⃣ Layer 2: Warehouse → What are the FACTS?            │   │
│  │   4️⃣ Layer 3: Journal   → What has HAPPENED before?      │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: The Core (User Identity & Brand Voice)

**Purpose:** The deepest, most permanent layer. Defines WHO is speaking and WHY.

### What's Stored
- User name, location, industry
- Job history and background (HVAC/Cook/Artist)
- Personal "why" story (Etsy struggle, etc.)
- Brand voice and personality traits
- Communication preferences
- Target audience description

### Database Table: `memory_core_profiles`
```sql
CREATE TABLE memory_core_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  
  -- Identity
  display_name TEXT,
  location TEXT,
  industry TEXT,
  business_name TEXT,
  
  -- Voice & Personality (JSONB)
  personality JSONB DEFAULT '{}',
  -- {
  --   "tone": "friendly-expert",
  --   "formality": "casual-professional",
  --   "humor": "light",
  --   "energy": "enthusiastic",
  --   "quirks": ["uses local Tampa references", "cooking metaphors"]
  -- }
  
  -- Biography & Story (JSONB)
  biography JSONB DEFAULT '{}',
  -- {
  --   "background": "Former HVAC tech turned cook turned digital marketer",
  --   "why_story": "Struggled on Etsy, learned marketing the hard way",
  --   "expertise": ["local SEO", "service businesses", "handmade products"],
  --   "struggles": ["time management", "consistency"],
  --   "wins": ["first 1000 followers", "first paid client"]
  -- }
  
  -- Brand Guidelines
  brand_voice_examples TEXT[], -- Example sentences in your voice
  forbidden_phrases TEXT[],    -- Never say these
  preferred_phrases TEXT[],    -- Always use these
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Usage
- **Injected into System Prompt** of every AI interaction
- Ensures the AI "sounds like you" in all responses
- Never changes during a session (stable foundation)

---

## Layer 2: The Warehouse (RAG Knowledge Base)

**Purpose:** The technical library of business facts. What the AI retrieves when it needs accurate information.

### What's Stored
- Service list and descriptions
- Pricing rules and packages
- Process steps and workflows
- FAQs and common objections
- Product descriptions (art, mugs, etc.)
- Industry-specific knowledge
- Legal disclaimers

### Database Table: `memory_knowledge_chunks`
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE memory_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Content
  category TEXT NOT NULL, -- 'services', 'pricing', 'faq', 'products', 'processes'
  title TEXT,
  content TEXT NOT NULL,
  
  -- Vector embedding for semantic search
  embedding vector(1536), -- OpenAI ada-002 dimension
  
  -- Metadata
  source TEXT, -- Where this info came from
  confidence FLOAT DEFAULT 1.0, -- How reliable is this info
  last_verified TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast vector similarity search
CREATE INDEX ON memory_knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Usage
- **Vector search** when AI needs to answer technical questions
- Query: "What are my HVAC service prices?" → Retrieves pricing chunks
- Prevents hallucination by grounding responses in real data

---

## Layer 3: The Journal (Episodic Event Memory)

**Purpose:** Timeline of every significant event in the system. The AI's "memory" of what has happened.

### What's Stored
- Blog posts published (date, title, topic)
- SMS/emails sent (to whom, about what)
- Leads captured (source, status)
- Social posts made
- Images generated
- Audit logs from "The Logic Belt"
- User actions and preferences

### Database Table: `memory_event_journal`
```sql
CREATE TABLE memory_event_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Event Classification
  event_type TEXT NOT NULL, -- 'blog_published', 'lead_captured', 'sms_sent', 'image_generated', 'social_posted'
  event_category TEXT, -- 'content', 'marketing', 'sales', 'system'
  
  -- Event Details
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  -- {
  --   "blog_id": "uuid",
  --   "topic": "HVAC maintenance tips",
  --   "word_count": 1200,
  --   "images_used": 3
  -- }
  
  -- Relationships
  related_entity_type TEXT, -- 'blog', 'lead', 'campaign'
  related_entity_id UUID,
  
  -- Timing
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Searchability
  search_text TEXT, -- Concatenated searchable text
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for time-based queries
CREATE INDEX ON memory_event_journal(user_id, occurred_at DESC);
CREATE INDEX ON memory_event_journal(event_type);

-- Full-text search index
CREATE INDEX ON memory_event_journal USING gin(to_tsvector('english', search_text));
```

### Usage
- AI can say: "I see we published an HVAC guide last Tuesday, let's follow up with a social post"
- Prevents duplicate actions
- Enables intelligent scheduling suggestions

---

## Layer 4: The Buffer (Real-Time Context Window)

**Purpose:** Short-term memory of the current conversation or task. What's happening RIGHT NOW.

### What's Stored
- Current conversation messages
- Active document being edited
- Recent user actions (last 10)
- Current page/context
- Selected items (images, drafts)
- Temporary preferences

### Database Table: `memory_context_buffer`
```sql
CREATE TABLE memory_context_buffer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL, -- Browser session or conversation ID
  
  -- Context Type
  context_type TEXT NOT NULL, -- 'conversation', 'document', 'action', 'selection'
  
  -- Content
  content JSONB NOT NULL,
  -- For conversation: { "role": "user", "message": "make that image grittier" }
  -- For document: { "document_id": "uuid", "current_content": "...", "cursor_position": 450 }
  -- For selection: { "selected_image_id": "uuid", "selected_text": "..." }
  
  -- Ordering
  sequence_num INT,
  
  -- TTL
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast session lookups
CREATE INDEX ON memory_context_buffer(user_id, session_id, created_at DESC);

-- Auto-cleanup expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_context()
RETURNS void AS $$
BEGIN
  DELETE FROM memory_context_buffer WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

### Usage
- When user says "make that image grittier," AI knows WHICH image
- Maintains conversation continuity
- Clears after session ends (24hr default TTL)

---

## The Priority Fetch Workflow

```typescript
async function prepareAIContext(userId: string, sessionId: string, query: string) {
  // 1️⃣ LAYER 4: What is user doing RIGHT NOW?
  const currentContext = await fetchBuffer(userId, sessionId);
  // Returns: current conversation, active document, selected items
  
  // 2️⃣ LAYER 1: How should I SOUND?
  const brandVoice = await fetchCore(userId);
  // Returns: personality, biography, voice examples
  
  // 3️⃣ LAYER 2: What are the FACTS?
  const relevantKnowledge = await vectorSearch(userId, query);
  // Returns: pricing, services, FAQs related to query
  
  // 4️⃣ LAYER 3: What has HAPPENED before?
  const recentEvents = await fetchJournal(userId, {
    limit: 10,
    relevantTo: query
  });
  // Returns: recent blog posts, actions, events
  
  // Assemble the enriched context
  return {
    systemPrompt: buildSystemPrompt(brandVoice),
    context: {
      currentTask: currentContext,
      factualBase: relevantKnowledge,
      history: recentEvents,
    }
  };
}
```

---

## Why This Prevents Hallucinations

| Problem | Solution |
|---------|----------|
| AI makes up prices | Layer 2 retrieves exact pricing from knowledge base |
| AI forgets conversation | Layer 4 maintains full conversation history |
| AI sounds generic | Layer 1 injects your specific brand voice |
| AI suggests duplicate content | Layer 3 shows what's already been published |
| AI doesn't know context | Layer 4 tracks current document/selection |

---

## Integration Points

### 1. Chat Widget
- Injects Layer 1 (voice) into system prompt
- Stores messages in Layer 4 (buffer)
- Queries Layer 2 (knowledge) for answers
- Logs interactions to Layer 3 (journal)

### 2. Content Forge (Blog Editor)
- Layer 4 tracks current draft
- Layer 2 provides relevant facts for content
- Layer 3 prevents duplicate topics
- Layer 1 ensures consistent voice

### 3. Visual Director (Image Generation)
- Layer 4 knows which image user is referring to
- Layer 2 has brand color/style guidelines
- Layer 3 tracks previously generated images

### 4. Concierge Agent
- Layer 1 defines conversation personality
- Layer 2 has pricing/service knowledge
- Layer 3 knows lead history
- Layer 4 maintains conversation state

---

## The Commander's Cockpit Vision

This 4-layer system transforms GreenLine365 from a "dumb tool" into an intelligent assistant that:

✅ **Remembers** everything about your business  
✅ **Sounds** authentically like you  
✅ **Knows** your services, prices, and processes  
✅ **Recalls** what's been done and what's pending  
✅ **Understands** the current context instantly  

This is what makes it a true "Commander's Cockpit" - you're not flying blind; you have full situational awareness.

---

*Architecture Document v1.0 - January 2026*
*GreenLine365 Dynamic Memory Bucket System*
