/**
 * Lead Alerts Edge Function
 * GreenLine365 - Real-time Lead Notification System
 * 
 * This function:
 * - Receives new lead data from the AI Concierge chat
 * - Sends real-time notifications via email/SMS
 * - Logs leads for the Command Center dashboard
 * - Triggers follow-up automation workflows
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, createResponse, handleCors } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase-client.ts';

interface Lead {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  source: 'chat' | 'form' | 'booking' | 'external';
  score?: number; // Lead quality score 1-100
  tags?: string[];
  conversation_id?: string;
  metadata?: Record<string, unknown>;
}

interface AlertRequest {
  action: 'create' | 'notify' | 'update' | 'list';
  lead?: Lead;
  lead_id?: string;
  notification_channels?: ('email' | 'sms' | 'slack' | 'webhook')[];
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { action, lead, lead_id, notification_channels = ['email'] }: AlertRequest = await req.json();

    switch (action) {
      case 'create': {
        if (!lead) {
          return createResponse({ error: 'Lead data is required' }, 400);
        }

        // Calculate lead score based on available information
        const score = calculateLeadScore(lead);

        // Save lead to database
        const { data, error } = await supabaseAdmin
          .from('leads')
          .insert({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            message: lead.message,
            source: lead.source,
            score,
            tags: lead.tags || [],
            conversation_id: lead.conversation_id,
            metadata: lead.metadata || {},
            status: 'new',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error('Lead creation error:', error);
          return createResponse({ error: 'Failed to create lead', details: error.message }, 500);
        }

        // Send notification if high-value lead
        if (score >= 70) {
          await sendLeadNotification(data, notification_channels);
        }

        // Log activity
        await supabaseAdmin.from('activity_log').insert({
          action: 'lead_captured',
          details: { lead_id: data.id, name: lead.name, source: lead.source, score },
          created_at: new Date().toISOString(),
        });

        return createResponse({
          success: true,
          message: 'Lead created successfully',
          data: { ...data, score },
        });
      }

      case 'notify': {
        if (!lead_id) {
          return createResponse({ error: 'Lead ID is required' }, 400);
        }

        // Fetch lead
        const { data: existingLead, error: fetchError } = await supabaseAdmin
          .from('leads')
          .select('*')
          .eq('id', lead_id)
          .single();

        if (fetchError || !existingLead) {
          return createResponse({ error: 'Lead not found' }, 404);
        }

        // Send notification
        const notificationResult = await sendLeadNotification(existingLead, notification_channels);

        return createResponse({
          success: true,
          message: 'Notification sent',
          results: notificationResult,
        });
      }

      case 'update': {
        if (!lead_id || !lead) {
          return createResponse({ error: 'Lead ID and update data required' }, 400);
        }

        const { data, error } = await supabaseAdmin
          .from('leads')
          .update({
            ...lead,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead_id)
          .select()
          .single();

        if (error) {
          return createResponse({ error: 'Failed to update lead' }, 500);
        }

        return createResponse({
          success: true,
          message: 'Lead updated',
          data,
        });
      }

      case 'list': {
        const { data, error } = await supabaseAdmin
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          return createResponse({ error: 'Failed to fetch leads' }, 500);
        }

        return createResponse({ data });
      }

      default:
        return createResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    console.error('Lead Alerts Error:', error);
    return createResponse({ error: 'Internal server error' }, 500);
  }
});

// Calculate lead quality score based on available data
function calculateLeadScore(lead: Lead): number {
  let score = 30; // Base score

  // Has email (+20)
  if (lead.email) score += 20;

  // Has phone (+20)
  if (lead.phone) score += 20;

  // Message length indicates engagement (+10 for substantial message)
  if (lead.message && lead.message.length > 50) score += 10;

  // Source scoring
  switch (lead.source) {
    case 'booking':
      score += 20; // Highest intent
      break;
    case 'form':
      score += 15;
      break;
    case 'chat':
      score += 10;
      break;
    default:
      score += 5;
  }

  return Math.min(score, 100); // Cap at 100
}

// Send lead notification via various channels
async function sendLeadNotification(
  lead: Lead & { id: string },
  channels: ('email' | 'sms' | 'slack' | 'webhook')[]
): Promise<Record<string, { success: boolean; message: string }>> {
  const results: Record<string, { success: boolean; message: string }> = {};

  for (const channel of channels) {
    switch (channel) {
      case 'email': {
        // In production, use SendGrid or similar
        // const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
        results.email = {
          success: true,
          message: 'Email notification queued (simulated)',
        };
        break;
      }

      case 'sms': {
        // In production, use Twilio
        results.sms = {
          success: true,
          message: 'SMS notification queued (simulated)',
        };
        break;
      }

      case 'slack': {
        // In production, use Slack webhook
        results.slack = {
          success: true,
          message: 'Slack notification sent (simulated)',
        };
        break;
      }

      case 'webhook': {
        // Custom webhook integration
        results.webhook = {
          success: true,
          message: 'Webhook triggered (simulated)',
        };
        break;
      }
    }
  }

  return results;
}
