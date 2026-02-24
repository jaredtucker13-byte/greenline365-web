/**
 * Notification Orchestrator
 *
 * Routes all system events to the right channels:
 * - Dashboard bell (always)
 * - Email fallback (if not read within 2 hours)
 * - Slack (for configured channels)
 *
 * Usage:
 *   import { notify } from '@/lib/notifications';
 *   await notify({
 *     businessId: '...',
 *     userId: '...',
 *     title: 'New incident filed',
 *     body: 'Incident #456 at 123 Main St',
 *     category: 'incident',
 *     severity: 'warning',
 *     sourceType: 'incident',
 *     sourceId: incidentId,
 *     actionUrl: '/admin-v2/incidents',
 *     actionLabel: 'View Incident',
 *   });
 */

import { createServerClient } from '@/lib/supabase/server';
import { postMessage } from '@/lib/slack';

// ── Types ──────────────────────────────────────────────────────────

export interface NotifyParams {
  businessId: string;
  userId?: string;       // If not provided, notifies all business owners
  title: string;
  body?: string;
  icon?: string;
  category?: 'system' | 'brain' | 'incident' | 'lead' | 'booking' | 'feedback' | 'badge' | 'pto' | 'alert';
  severity?: 'info' | 'success' | 'warning' | 'critical';
  sourceType?: string;
  sourceId?: string;
  actionUrl?: string;
  actionLabel?: string;
  channels?: ('dashboard' | 'email' | 'slack')[];
  slackChannel?: string; // Override default Slack channel
}

// ── Icons by category ──────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  system: 'bell',
  brain: 'brain',
  incident: 'alert-triangle',
  lead: 'user-plus',
  booking: 'calendar-check',
  feedback: 'message-circle',
  badge: 'award',
  pto: 'calendar-off',
  alert: 'alert-octagon',
};

// ── Core notify function ───────────────────────────────────────────

export async function notify(params: NotifyParams): Promise<string | null> {
  const supabase = createServerClient();
  const {
    businessId,
    title,
    body,
    category = 'system',
    severity = 'info',
    sourceType,
    sourceId,
    actionUrl,
    actionLabel,
    channels = ['dashboard'],
    slackChannel,
  } = params;

  const icon = params.icon || CATEGORY_ICONS[category] || 'bell';

  try {
    // Resolve userId — if not provided, find the business owner
    let userId = params.userId;
    if (!userId) {
      const { data: owner } = await supabase
        .from('user_businesses')
        .select('user_id')
        .eq('business_id', businessId)
        .eq('role', 'owner')
        .limit(1)
        .single();

      userId = owner?.user_id;
    }

    if (!userId) {
      console.error('[Notify] Could not resolve user for business:', businessId);
      return null;
    }

    // Insert notification into database
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        business_id: businessId,
        user_id: userId,
        title,
        body,
        icon,
        category,
        severity,
        source_type: sourceType,
        source_id: sourceId,
        action_url: actionUrl,
        action_label: actionLabel,
        channels,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Notify] Insert error:', error);
      return null;
    }

    // Send to Slack if requested
    if (channels.includes('slack') && slackChannel) {
      try {
        const severityEmoji: Record<string, string> = {
          info: ':information_source:',
          success: ':white_check_mark:',
          warning: ':warning:',
          critical: ':rotating_light:',
        };

        const emoji = severityEmoji[severity] || ':bell:';
        const slackText = `${emoji} *${title}*${body ? `\n${body}` : ''}${actionUrl ? `\n<${process.env.NEXT_PUBLIC_SITE_URL || ''}${actionUrl}|${actionLabel || 'View'}>` : ''}`;

        await postMessage({
          channel: slackChannel,
          text: slackText,
        });
      } catch (slackErr) {
        console.error('[Notify] Slack send failed:', slackErr);
      }
    }

    return notification?.id || null;
  } catch (error) {
    console.error('[Notify] Error:', error);
    return null;
  }
}

// ── Batch notify all admins of a business ──────────────────────────

export async function notifyBusinessAdmins(
  params: Omit<NotifyParams, 'userId'>
): Promise<string[]> {
  const supabase = createServerClient();

  const { data: admins } = await supabase
    .from('user_businesses')
    .select('user_id')
    .eq('business_id', params.businessId)
    .in('role', ['owner', 'admin']);

  if (!admins?.length) return [];

  const ids: string[] = [];
  for (const admin of admins) {
    const id = await notify({ ...params, userId: admin.user_id });
    if (id) ids.push(id);
  }

  return ids;
}
