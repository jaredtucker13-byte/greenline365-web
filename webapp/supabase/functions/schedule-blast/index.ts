/**
 * Schedule Blast Edge Function
 * GreenLine365 - Content Scheduling & Social Media Posting
 * 
 * This function handles:
 * - Scheduling social media posts
 * - Email campaign scheduling
 * - Content distribution to multiple platforms
 * 
 * Triggered from the Content Forge modal in the Tactical Command Center
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, createResponse, handleCors } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';

interface ScheduledContent {
  id?: string;
  title: string;
  content: string;
  platforms: string[]; // ['instagram', 'facebook', 'twitter', 'email']
  scheduled_at: string;
  media_urls?: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  client_id?: string;
  metadata?: Record<string, unknown>;
}

interface BlastRequest {
  action: 'schedule' | 'publish_now' | 'cancel' | 'list';
  content?: ScheduledContent;
  content_id?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { action, content, content_id }: BlastRequest = await req.json();

    switch (action) {
      case 'schedule': {
        if (!content) {
          return createResponse({ error: 'Content is required for scheduling' }, 400);
        }

        // Save to content_schedule table
        const { data, error } = await supabaseAdmin
          .from('content_schedule')
          .insert({
            title: content.title,
            content: content.content,
            platforms: content.platforms,
            scheduled_at: content.scheduled_at,
            media_urls: content.media_urls || [],
            status: 'scheduled',
            client_id: content.client_id,
            metadata: content.metadata || {},
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Schedule error:', error);
          return createResponse({ error: 'Failed to schedule content', details: error.message }, 500);
        }

        // Log the activity
        await supabaseAdmin.from('activity_log').insert({
          action: 'content_scheduled',
          details: { content_id: data.id, title: content.title, platforms: content.platforms },
          created_at: new Date().toISOString(),
        });

        return createResponse({
          success: true,
          message: 'Content scheduled successfully',
          data,
        });
      }

      case 'publish_now': {
        if (!content_id && !content) {
          return createResponse({ error: 'Content ID or content is required' }, 400);
        }

        // If publishing existing scheduled content
        if (content_id) {
          const { data: existingContent, error: fetchError } = await supabaseAdmin
            .from('content_schedule')
            .select('*')
            .eq('id', content_id)
            .single();

          if (fetchError || !existingContent) {
            return createResponse({ error: 'Content not found' }, 404);
          }

          // Simulate publishing to platforms
          // In production, this would call actual social media APIs
          const publishResults = await publishToPlatforms(existingContent);

          // Update status
          await supabaseAdmin
            .from('content_schedule')
            .update({ 
              status: publishResults.success ? 'published' : 'failed',
              published_at: new Date().toISOString(),
              publish_results: publishResults,
            })
            .eq('id', content_id);

          return createResponse({
            success: publishResults.success,
            message: publishResults.success ? 'Content published successfully' : 'Publishing failed',
            results: publishResults,
          });
        }

        // If publishing new content immediately
        if (content) {
          const publishResults = await publishToPlatforms(content);
          
          // Save as published
          const { data, error } = await supabaseAdmin
            .from('content_schedule')
            .insert({
              ...content,
              status: 'published',
              published_at: new Date().toISOString(),
              publish_results: publishResults,
            })
            .select()
            .single();

          return createResponse({
            success: publishResults.success,
            message: publishResults.success ? 'Content published immediately' : 'Publishing failed',
            data,
            results: publishResults,
          });
        }

        return createResponse({ error: 'Invalid request' }, 400);
      }

      case 'cancel': {
        if (!content_id) {
          return createResponse({ error: 'Content ID is required' }, 400);
        }

        const { error } = await supabaseAdmin
          .from('content_schedule')
          .update({ status: 'cancelled' })
          .eq('id', content_id);

        if (error) {
          return createResponse({ error: 'Failed to cancel content' }, 500);
        }

        return createResponse({
          success: true,
          message: 'Content scheduling cancelled',
        });
      }

      case 'list': {
        const { data, error } = await supabaseAdmin
          .from('content_schedule')
          .select('*')
          .order('scheduled_at', { ascending: true });

        if (error) {
          return createResponse({ error: 'Failed to fetch content' }, 500);
        }

        return createResponse({ data });
      }

      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    console.error('Schedule Blast Error:', error);
    return createResponse({ error: 'Internal server error' }, 500);
  }
});

// Simulate publishing to social media platforms
// In production, replace with actual API integrations
async function publishToPlatforms(content: ScheduledContent) {
  const results: Record<string, { success: boolean; message: string }> = {};

  for (const platform of content.platforms) {
    // Simulate API calls - in production, integrate with actual platform APIs
    switch (platform) {
      case 'instagram':
        // Would use Instagram Graph API
        results.instagram = { success: true, message: 'Posted to Instagram (simulated)' };
        break;
      case 'facebook':
        // Would use Facebook Graph API
        results.facebook = { success: true, message: 'Posted to Facebook (simulated)' };
        break;
      case 'twitter':
        // Would use Twitter/X API v2
        results.twitter = { success: true, message: 'Posted to Twitter/X (simulated)' };
        break;
      case 'email':
        // Would use SendGrid or similar
        results.email = { success: true, message: 'Email campaign queued (simulated)' };
        break;
      default:
        results[platform] = { success: false, message: `Unknown platform: ${platform}` };
    }
  }

  const allSuccess = Object.values(results).every(r => r.success);
  return { success: allSuccess, platforms: results };
}
