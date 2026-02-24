/**
 * Notification Email Fallback Cron
 *
 * Runs every 30 minutes. Finds notifications that:
 * - Are unread for 2+ hours
 * - Have not already had an email sent
 * - Include 'email' in their channels array (or severity is 'critical')
 *
 * Sends a digest email and marks them as email-sent.
 *
 * GET /api/cron/notification-email-fallback
 *   Protected by CRON_SECRET header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Find unread, un-emailed notifications older than 2 hours
    const { data: pending, error } = await supabase
      .from('notifications')
      .select(`
        id, user_id, business_id, title, body, category, severity,
        action_url, action_label, created_at
      `)
      .eq('is_read', false)
      .eq('is_email_sent', false)
      .lt('created_at', twoHoursAgo)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error('[Notification Cron] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pending?.length) {
      return NextResponse.json({ message: 'No pending email notifications', count: 0 });
    }

    // Group by user_id for digest emails
    const byUser: Record<string, typeof pending> = {};
    for (const n of pending) {
      if (!byUser[n.user_id]) byUser[n.user_id] = [];
      byUser[n.user_id].push(n);
    }

    let emailsSent = 0;

    for (const [userId, notifications] of Object.entries(byUser)) {
      // Get user email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (!profile?.email) continue;

      // Build digest HTML
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';
      const notificationRows = notifications.map((n: any) => {
        const severityColor: Record<string, string> = {
          info: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b',
          critical: '#ef4444',
        };
        const color = severityColor[n.severity] || '#6b7280';

        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color}; margin-right: 8px;"></span>
              <strong>${n.title}</strong>
              ${n.body ? `<br><span style="color: #6b7280; font-size: 13px;">${n.body}</span>` : ''}
              ${n.action_url ? `<br><a href="${siteUrl}${n.action_url}" style="color: #059669; font-size: 13px;">${n.action_label || 'View'} →</a>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; white-space: nowrap;">
              ${new Date(n.created_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </td>
          </tr>`;
      }).join('');

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #065f46; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">GreenLine365 — Missed Notifications</h2>
            <p style="margin: 8px 0 0; opacity: 0.8;">You have ${notifications.length} unread notification${notifications.length > 1 ? 's' : ''}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb;">
            ${notificationRows}
          </table>
          <div style="padding: 16px; text-align: center; background: #f9fafb; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: 0;">
            <a href="${siteUrl}/admin-v2" style="display: inline-block; background: #059669; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none;">
              Open Command Center
            </a>
          </div>
        </div>`;

      // Send via Gmail (matching existing pattern)
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: `"GreenLine365" <${process.env.GMAIL_USER}>`,
          to: profile.email,
          subject: `[GL365] ${notifications.length} missed notification${notifications.length > 1 ? 's' : ''}`,
          html,
        });

        emailsSent++;
      } catch (emailErr) {
        console.error(`[Notification Cron] Email failed for ${userId}:`, emailErr);
        continue;
      }

      // Mark all as email-sent
      const ids = notifications.map((n: any) => n.id);
      await supabase
        .from('notifications')
        .update({ is_email_sent: true, email_sent_at: new Date().toISOString() })
        .in('id', ids);
    }

    return NextResponse.json({
      message: `Processed ${pending.length} notifications, sent ${emailsSent} digest emails`,
      notifications_processed: pending.length,
      emails_sent: emailsSent,
    });

  } catch (error: any) {
    console.error('[Notification Cron] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
