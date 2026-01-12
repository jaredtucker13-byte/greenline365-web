/**
 * Event Logger Service - Memory Bucket Layer 3 (Journal)
 * 
 * Auto-tracks all significant events in the system for:
 * 1. AI context (what has this user done before?)
 * 2. Analytics (what patterns emerge?)
 * 3. Audit trail (what happened when?)
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Event types for categorization
export type EventType = 
  // Content Events
  | 'blog_created'
  | 'blog_published'
  | 'blog_updated'
  | 'blog_deleted'
  | 'content_generated'
  // Image Events
  | 'image_analyzed'
  | 'image_generated'
  | 'image_applied'
  // Communication Events
  | 'email_sent'
  | 'email_campaign_created'
  | 'sms_sent'
  | 'sms_template_created'
  // Lead Events
  | 'lead_captured'
  | 'lead_contacted'
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  // Social Events
  | 'social_connected'
  | 'social_post_scheduled'
  | 'social_post_published'
  // System Events
  | 'knowledge_added'
  | 'brand_voice_updated'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'session_started';

export type EventCategory = 'content' | 'marketing' | 'sales' | 'social' | 'system';

export interface LogEventParams {
  userId: string;
  eventType: EventType;
  title?: string;
  description?: string;
  category?: EventCategory;
  metadata?: Record<string, any>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  outcome?: 'success' | 'partial' | 'failed' | 'pending';
  aiGenerated?: boolean;
  aiModelUsed?: string;
  tags?: string[];
}

// Category mapping
const EVENT_CATEGORIES: Record<EventType, EventCategory> = {
  blog_created: 'content',
  blog_published: 'content',
  blog_updated: 'content',
  blog_deleted: 'content',
  content_generated: 'content',
  image_analyzed: 'content',
  image_generated: 'content',
  image_applied: 'content',
  email_sent: 'marketing',
  email_campaign_created: 'marketing',
  sms_sent: 'marketing',
  sms_template_created: 'marketing',
  lead_captured: 'sales',
  lead_contacted: 'sales',
  booking_created: 'sales',
  booking_confirmed: 'sales',
  booking_cancelled: 'sales',
  social_connected: 'social',
  social_post_scheduled: 'social',
  social_post_published: 'social',
  knowledge_added: 'system',
  brand_voice_updated: 'system',
  onboarding_started: 'system',
  onboarding_completed: 'system',
  session_started: 'system',
};

/**
 * Log an event to the Memory Event Journal
 */
export async function logEvent(
  supabase: SupabaseClient,
  params: LogEventParams
): Promise<string | null> {
  try {
    const searchText = [
      params.title,
      params.description,
      params.eventType,
      ...(params.tags || []),
    ].filter(Boolean).join(' ');

    const { data, error } = await supabase
      .from('memory_event_journal')
      .insert({
        user_id: params.userId,
        event_type: params.eventType,
        event_category: params.category || EVENT_CATEGORIES[params.eventType],
        title: params.title,
        description: params.description,
        metadata: params.metadata || {},
        related_entity_type: params.relatedEntityType,
        related_entity_id: params.relatedEntityId,
        outcome: params.outcome || 'success',
        ai_generated: params.aiGenerated || false,
        ai_model_used: params.aiModelUsed,
        tags: params.tags || [],
        search_text: searchText,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[EventLogger] Error:', error);
      return null;
    }

    return data?.id || null;
  } catch (e) {
    console.error('[EventLogger] Exception:', e);
    return null;
  }
}

/**
 * Helper functions for common event types
 */
export const EventLogger = {
  // Content events
  async blogCreated(supabase: SupabaseClient, userId: string, blogId: string, title: string, wordCount?: number) {
    return logEvent(supabase, {
      userId,
      eventType: 'blog_created',
      title: `Created: ${title}`,
      relatedEntityType: 'blog',
      relatedEntityId: blogId,
      metadata: { blogId, title, wordCount },
    });
  },

  async blogPublished(supabase: SupabaseClient, userId: string, blogId: string, title: string) {
    return logEvent(supabase, {
      userId,
      eventType: 'blog_published',
      title: `Published: ${title}`,
      relatedEntityType: 'blog',
      relatedEntityId: blogId,
      metadata: { blogId, title },
    });
  },

  // Image events
  async imageAnalyzed(supabase: SupabaseClient, userId: string, blogTitle: string, suggestionsCount: number) {
    return logEvent(supabase, {
      userId,
      eventType: 'image_analyzed',
      title: `Analyzed images for: ${blogTitle}`,
      description: `Generated ${suggestionsCount} image suggestions`,
      metadata: { blogTitle, suggestionsCount },
      aiGenerated: true,
    });
  },

  async imageGenerated(supabase: SupabaseClient, userId: string, prompt: string, model: string, imageUrl?: string) {
    return logEvent(supabase, {
      userId,
      eventType: 'image_generated',
      title: 'Generated image',
      description: prompt.slice(0, 200),
      metadata: { prompt, model, imageUrl },
      aiGenerated: true,
      aiModelUsed: model,
    });
  },

  // Communication events
  async emailSent(supabase: SupabaseClient, userId: string, subject: string, recipientCount: number) {
    return logEvent(supabase, {
      userId,
      eventType: 'email_sent',
      title: `Email: ${subject}`,
      description: `Sent to ${recipientCount} recipient(s)`,
      metadata: { subject, recipientCount },
    });
  },

  async smsSent(supabase: SupabaseClient, userId: string, recipientPhone: string, messagePreview: string) {
    return logEvent(supabase, {
      userId,
      eventType: 'sms_sent',
      title: 'SMS sent',
      description: messagePreview.slice(0, 100),
      metadata: { recipientPhone: recipientPhone.slice(-4), messageLength: messagePreview.length },
    });
  },

  // Lead events
  async leadCaptured(supabase: SupabaseClient, userId: string, leadId: string, source: string, leadName?: string) {
    return logEvent(supabase, {
      userId,
      eventType: 'lead_captured',
      title: leadName ? `New lead: ${leadName}` : 'New lead captured',
      relatedEntityType: 'lead',
      relatedEntityId: leadId,
      metadata: { leadId, source, leadName },
    });
  },

  async bookingCreated(supabase: SupabaseClient, userId: string, bookingId: string, clientName: string, datetime: string) {
    return logEvent(supabase, {
      userId,
      eventType: 'booking_created',
      title: `Booking: ${clientName}`,
      description: `Scheduled for ${datetime}`,
      relatedEntityType: 'booking',
      relatedEntityId: bookingId,
      metadata: { bookingId, clientName, datetime },
    });
  },

  // Knowledge events
  async knowledgeAdded(supabase: SupabaseClient, userId: string, category: string, title?: string) {
    return logEvent(supabase, {
      userId,
      eventType: 'knowledge_added',
      title: title ? `Added: ${title}` : `Added ${category} knowledge`,
      metadata: { category, title },
    });
  },

  async brandVoiceUpdated(supabase: SupabaseClient, userId: string) {
    return logEvent(supabase, {
      userId,
      eventType: 'brand_voice_updated',
      title: 'Brand voice settings updated',
    });
  },

  // Onboarding events
  async onboardingStarted(supabase: SupabaseClient, userId: string, method: 'wizard' | 'long-form') {
    return logEvent(supabase, {
      userId,
      eventType: 'onboarding_started',
      title: 'Started onboarding',
      metadata: { method },
    });
  },

  async onboardingCompleted(supabase: SupabaseClient, userId: string, stepsCompleted: string[]) {
    return logEvent(supabase, {
      userId,
      eventType: 'onboarding_completed',
      title: 'Completed onboarding',
      metadata: { stepsCompleted, completedAt: new Date().toISOString() },
    });
  },
};

export default EventLogger;
