/**
 * Dynamic Memory Bucket System - TypeScript Service
 * 
 * The "Brain" of GreenLine365
 * 4-Layer hierarchy that ensures AI doesn't guess; it knows exactly
 * who you are, what you've done, and how your business works.
 * 
 * Priority Fetch Order:
 * 1. Layer 4 (Buffer) - What is user doing RIGHT NOW?
 * 2. Layer 1 (Core) - How should I SOUND?
 * 3. Layer 2 (Warehouse) - What are the FACTS?
 * 4. Layer 3 (Journal) - What has HAPPENED before?
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface CoreProfile {
  displayName?: string;
  location?: string;
  industry?: string;
  businessName?: string;
  personality: {
    tone: string;
    formality: string;
    humor: string;
    energy: string;
    quirks?: string[];
  };
  biography: {
    background?: string;
    whyStory?: string;
    expertise?: string[];
    struggles?: string[];
    wins?: string[];
  };
  voiceExamples: string[];
  forbiddenPhrases: string[];
  preferredPhrases: string[];
  targetAudience?: {
    demographics?: string;
    painPoints?: string[];
    desires?: string[];
  };
}

export interface KnowledgeChunk {
  id: string;
  category: string;
  subcategory?: string;
  title?: string;
  content: string;
  confidence: number;
  priority: number;
  similarity?: number; // Added during vector search
}

export interface EventJournalEntry {
  id: string;
  eventType: string;
  eventCategory?: string;
  title?: string;
  description?: string;
  metadata: Record<string, any>;
  occurredAt: Date;
  outcome?: string;
}

export interface ContextBufferEntry {
  id: string;
  contextType: 'message' | 'document' | 'selection' | 'action' | 'preference';
  content: Record<string, any>;
  sequenceNum: number;
  importance: number;
  createdAt: Date;
}

export interface AIContext {
  // Layer 4: Current context
  currentTask: {
    conversation: ContextBufferEntry[];
    activeDocument?: ContextBufferEntry;
    currentSelection?: ContextBufferEntry;
    recentActions: ContextBufferEntry[];
  };
  // Layer 1: Brand voice
  brandVoice: CoreProfile | null;
  // Layer 2: Relevant knowledge
  factualBase: KnowledgeChunk[];
  // Layer 3: Historical events
  history: EventJournalEntry[];
}

// ============================================
// MEMORY BUCKET SERVICE
// ============================================

export class MemoryBucketService {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(supabaseClient: SupabaseClient, userId: string) {
    this.supabase = supabaseClient;
    this.userId = userId;
  }

  // ========================================
  // LAYER 1: CORE (Brand Voice)
  // ========================================

  async getCoreProfile(): Promise<CoreProfile | null> {
    const { data, error } = await this.supabase
      .from('memory_core_profiles')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error || !data) return null;

    return {
      displayName: data.display_name,
      location: data.location,
      industry: data.industry,
      businessName: data.business_name,
      personality: data.personality || {},
      biography: data.biography || {},
      voiceExamples: data.brand_voice_examples || [],
      forbiddenPhrases: data.forbidden_phrases || [],
      preferredPhrases: data.preferred_phrases || [],
      targetAudience: data.target_audience,
    };
  }

  async updateCoreProfile(profile: Partial<CoreProfile>): Promise<boolean> {
    const { error } = await this.supabase
      .from('memory_core_profiles')
      .upsert({
        user_id: this.userId,
        display_name: profile.displayName,
        location: profile.location,
        industry: profile.industry,
        business_name: profile.businessName,
        personality: profile.personality,
        biography: profile.biography,
        brand_voice_examples: profile.voiceExamples,
        forbidden_phrases: profile.forbiddenPhrases,
        preferred_phrases: profile.preferredPhrases,
        target_audience: profile.targetAudience,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return !error;
  }

  // ========================================
  // LAYER 2: WAREHOUSE (Knowledge RAG)
  // ========================================

  async addKnowledge(chunk: {
    category: string;
    subcategory?: string;
    title?: string;
    content: string;
    source?: string;
    confidence?: number;
    priority?: number;
  }): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('memory_knowledge_chunks')
      .insert({
        user_id: this.userId,
        category: chunk.category,
        subcategory: chunk.subcategory,
        title: chunk.title,
        content: chunk.content,
        source: chunk.source || 'manual',
        confidence: chunk.confidence || 1.0,
        priority: chunk.priority || 5,
      })
      .select('id')
      .single();

    return data?.id || null;
  }

  async searchKnowledge(query: string, options?: {
    category?: string;
    limit?: number;
  }): Promise<KnowledgeChunk[]> {
    // For now, use text search. In production, this would use vector embeddings.
    let queryBuilder = this.supabase
      .from('memory_knowledge_chunks')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_active', true)
      .ilike('content', `%${query}%`)
      .order('priority', { ascending: false })
      .limit(options?.limit || 5);

    if (options?.category) {
      queryBuilder = queryBuilder.eq('category', options.category);
    }

    const { data, error } = await queryBuilder;

    if (error || !data) return [];

    return data.map(d => ({
      id: d.id,
      category: d.category,
      subcategory: d.subcategory,
      title: d.title,
      content: d.content,
      confidence: d.confidence,
      priority: d.priority,
    }));
  }

  async getKnowledgeByCategory(category: string): Promise<KnowledgeChunk[]> {
    const { data, error } = await this.supabase
      .from('memory_knowledge_chunks')
      .select('*')
      .eq('user_id', this.userId)
      .eq('category', category)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error || !data) return [];

    return data.map(d => ({
      id: d.id,
      category: d.category,
      subcategory: d.subcategory,
      title: d.title,
      content: d.content,
      confidence: d.confidence,
      priority: d.priority,
    }));
  }

  // ========================================
  // LAYER 3: JOURNAL (Event Memory)
  // ========================================

  async logEvent(event: {
    eventType: string;
    eventCategory?: string;
    title?: string;
    description?: string;
    metadata?: Record<string, any>;
    tags?: string[];
    relatedEntityType?: string;
    relatedEntityId?: string;
    outcome?: string;
    aiGenerated?: boolean;
    aiModelUsed?: string;
  }): Promise<string | null> {
    const searchText = [
      event.title,
      event.description,
      event.eventType,
      ...(event.tags || []),
    ].filter(Boolean).join(' ');

    const { data, error } = await this.supabase
      .from('memory_event_journal')
      .insert({
        user_id: this.userId,
        event_type: event.eventType,
        event_category: event.eventCategory || 'system',
        title: event.title,
        description: event.description,
        metadata: event.metadata || {},
        tags: event.tags || [],
        related_entity_type: event.relatedEntityType,
        related_entity_id: event.relatedEntityId,
        outcome: event.outcome,
        ai_generated: event.aiGenerated || false,
        ai_model_used: event.aiModelUsed,
        search_text: searchText,
      })
      .select('id')
      .single();

    return data?.id || null;
  }

  async getRecentEvents(options?: {
    eventTypes?: string[];
    category?: string;
    limit?: number;
    daysBack?: number;
  }): Promise<EventJournalEntry[]> {
    const daysBack = options?.daysBack || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    let queryBuilder = this.supabase
      .from('memory_event_journal')
      .select('*')
      .eq('user_id', this.userId)
      .gte('occurred_at', cutoffDate.toISOString())
      .order('occurred_at', { ascending: false })
      .limit(options?.limit || 10);

    if (options?.eventTypes?.length) {
      queryBuilder = queryBuilder.in('event_type', options.eventTypes);
    }

    if (options?.category) {
      queryBuilder = queryBuilder.eq('event_category', options.category);
    }

    const { data, error } = await queryBuilder;

    if (error || !data) return [];

    return data.map(d => ({
      id: d.id,
      eventType: d.event_type,
      eventCategory: d.event_category,
      title: d.title,
      description: d.description,
      metadata: d.metadata,
      occurredAt: new Date(d.occurred_at),
      outcome: d.outcome,
    }));
  }

  async searchEvents(query: string, limit: number = 10): Promise<EventJournalEntry[]> {
    const { data, error } = await this.supabase
      .from('memory_event_journal')
      .select('*')
      .eq('user_id', this.userId)
      .textSearch('search_text', query)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map(d => ({
      id: d.id,
      eventType: d.event_type,
      eventCategory: d.event_category,
      title: d.title,
      description: d.description,
      metadata: d.metadata,
      occurredAt: new Date(d.occurred_at),
      outcome: d.outcome,
    }));
  }

  // ========================================
  // LAYER 4: BUFFER (Real-Time Context)
  // ========================================

  async addToBuffer(sessionId: string, entry: {
    contextType: 'message' | 'document' | 'selection' | 'action' | 'preference';
    content: Record<string, any>;
    importance?: number;
  }): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('memory_context_buffer')
      .insert({
        user_id: this.userId,
        session_id: sessionId,
        context_type: entry.contextType,
        content: entry.content,
        importance: entry.importance || 5,
      })
      .select('id')
      .single();

    return data?.id || null;
  }

  async getConversationHistory(sessionId: string, limit: number = 20): Promise<ContextBufferEntry[]> {
    const { data, error } = await this.supabase
      .from('memory_context_buffer')
      .select('*')
      .eq('user_id', this.userId)
      .eq('session_id', sessionId)
      .eq('context_type', 'message')
      .gt('expires_at', new Date().toISOString())
      .order('sequence_num', { ascending: true })
      .limit(limit);

    if (error || !data) return [];

    return data.map(d => ({
      id: d.id,
      contextType: d.context_type,
      content: d.content,
      sequenceNum: d.sequence_num,
      importance: d.importance,
      createdAt: new Date(d.created_at),
    }));
  }

  async getCurrentContext(sessionId: string): Promise<{
    conversation: ContextBufferEntry[];
    activeDocument?: ContextBufferEntry;
    currentSelection?: ContextBufferEntry;
    recentActions: ContextBufferEntry[];
  }> {
    const { data, error } = await this.supabase
      .from('memory_context_buffer')
      .select('*')
      .eq('user_id', this.userId)
      .eq('session_id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .order('sequence_num', { ascending: true });

    if (error || !data) {
      return { conversation: [], recentActions: [] };
    }

    const entries = data.map(d => ({
      id: d.id,
      contextType: d.context_type as ContextBufferEntry['contextType'],
      content: d.content,
      sequenceNum: d.sequence_num,
      importance: d.importance,
      createdAt: new Date(d.created_at),
    }));

    return {
      conversation: entries.filter(e => e.contextType === 'message'),
      activeDocument: entries.find(e => e.contextType === 'document'),
      currentSelection: entries.find(e => e.contextType === 'selection'),
      recentActions: entries.filter(e => e.contextType === 'action').slice(-10),
    };
  }

  async clearSessionBuffer(sessionId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('memory_context_buffer')
      .delete()
      .eq('user_id', this.userId)
      .eq('session_id', sessionId);

    return !error;
  }

  // ========================================
  // UNIFIED AI CONTEXT BUILDER
  // ========================================

  /**
   * Build complete AI context using Priority Fetch Order:
   * 1. Layer 4 (Buffer) - Current context
   * 2. Layer 1 (Core) - Brand voice  
   * 3. Layer 2 (Warehouse) - Relevant knowledge
   * 4. Layer 3 (Journal) - Recent history
   */
  async prepareAIContext(sessionId: string, query?: string): Promise<AIContext> {
    // Fetch all layers in parallel for performance
    const [currentTask, brandVoice, factualBase, history] = await Promise.all([
      // Layer 4: Current context
      this.getCurrentContext(sessionId),
      // Layer 1: Brand voice
      this.getCoreProfile(),
      // Layer 2: Knowledge (if query provided)
      query ? this.searchKnowledge(query, { limit: 5 }) : Promise.resolve([]),
      // Layer 3: Recent events
      this.getRecentEvents({ limit: 10, daysBack: 14 }),
    ]);

    return {
      currentTask,
      brandVoice,
      factualBase,
      history,
    };
  }

  /**
   * Build system prompt with brand voice injected
   */
  buildSystemPrompt(brandVoice: CoreProfile | null, basePrompt: string): string {
    if (!brandVoice) return basePrompt;

    const voiceInstructions = `
BRAND VOICE INSTRUCTIONS:
- Tone: ${brandVoice.personality.tone}
- Formality: ${brandVoice.personality.formality}
- Energy: ${brandVoice.personality.energy}
${brandVoice.personality.quirks?.length ? `- Quirks: ${brandVoice.personality.quirks.join(', ')}` : ''}
${brandVoice.biography.background ? `- Background: ${brandVoice.biography.background}` : ''}
${brandVoice.preferredPhrases.length ? `- Preferred phrases: "${brandVoice.preferredPhrases.join('", "')}"` : ''}
${brandVoice.forbiddenPhrases.length ? `- NEVER say: "${brandVoice.forbiddenPhrases.join('", "')}"` : ''}
${brandVoice.voiceExamples.length ? `- Voice examples: "${brandVoice.voiceExamples.slice(0, 2).join('", "')}"` : ''}
`;

    return `${basePrompt}\n\n${voiceInstructions}`;
  }

  /**
   * Format context for AI message injection
   */
  formatContextForAI(context: AIContext): string {
    const parts: string[] = [];

    // Current conversation context
    if (context.currentTask.conversation.length > 0) {
      const recentMessages = context.currentTask.conversation.slice(-5);
      parts.push('RECENT CONVERSATION:');
      recentMessages.forEach(msg => {
        parts.push(`${msg.content.role}: ${msg.content.content}`);
      });
    }

    // Current selection/document
    if (context.currentTask.currentSelection) {
      parts.push(`\nCURRENTLY SELECTED: ${JSON.stringify(context.currentTask.currentSelection.content)}`);
    }

    // Relevant knowledge
    if (context.factualBase.length > 0) {
      parts.push('\nRELEVANT FACTS:');
      context.factualBase.forEach(chunk => {
        parts.push(`- [${chunk.category}] ${chunk.content.slice(0, 200)}...`);
      });
    }

    // Recent events
    if (context.history.length > 0) {
      parts.push('\nRECENT EVENTS:');
      context.history.slice(0, 5).forEach(event => {
        const date = event.occurredAt.toLocaleDateString();
        parts.push(`- ${date}: ${event.eventType} - ${event.title || event.description}`);
      });
    }

    return parts.join('\n');
  }
}

// ============================================
// SINGLETON FACTORY
// ============================================

let memoryServiceInstance: MemoryBucketService | null = null;

export function getMemoryBucketService(
  supabaseClient: SupabaseClient,
  userId: string
): MemoryBucketService {
  // Create new instance if user changed or none exists
  if (!memoryServiceInstance || (memoryServiceInstance as any).userId !== userId) {
    memoryServiceInstance = new MemoryBucketService(supabaseClient, userId);
  }
  return memoryServiceInstance;
}

export default MemoryBucketService;
