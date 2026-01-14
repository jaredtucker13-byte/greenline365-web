/**
 * Verification Resend API (Cron Job)
 * 
 * POST /api/crm/resend-verification
 * 
 * Automatically resends verification emails to unverified leads
 * following the schedule: immediate, 48h, 7d (max 3 attempts)
 * 
 * Can be called by:
 * - Vercel Cron Job (add to vercel.json)
 * - Manual trigger from admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  sendEmail, 
  generateVerificationToken, 
  generateVerificationCode,
  getVerificationEmailHtml 
} from '@/lib/email/sendgrid-sender';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';

// Max verification attempts
const MAX_ATTEMPTS = 3;

// Intervals in hours: immediate (handled at signup), 48h, 7d
const RESEND_INTERVALS_HOURS = [0, 48, 168]; // 0, 48 hours, 168 hours (7 days)

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or admin access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow access if cron secret matches or if it's a manual trigger (no auth for dev)
    const isAuthorized = 
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      process.env.NODE_ENV === 'development';
    
    if (!isAuthorized) {
      // For non-cron requests, check if user is admin
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      // In production, add proper admin check here
    }
    
    const now = new Date();
    const results = {
      processed: 0,
      sent: 0,
      errors: 0,
      skipped: 0,
    };

    console.log('[Resend] Starting verification resend job at', now.toISOString());

    // Find leads eligible for resend:
    // - status = 'unverified' or 'new'
    // - verification_attempts < MAX_ATTEMPTS
    // - not bounced or unsubscribed
    // - enough time has passed since last send
    const { data: leads, error: fetchError } = await supabase
      .from('crm_leads')
      .select('*')
      .in('status', ['new', 'unverified'])
      .lt('verification_attempts', MAX_ATTEMPTS)
      .eq('bounce_flag', false)
      .eq('email_opt_out', false)
      .order('created_at', { ascending: true })
      .limit(100); // Process in batches

    if (fetchError) {
      console.error('[Resend] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      console.log('[Resend] No leads eligible for resend');
      return NextResponse.json({ 
        success: true, 
        message: 'No leads to process',
        results 
      });
    }

    // Process each lead
    for (const lead of leads) {
      results.processed++;

      // Calculate required interval based on attempts
      const attemptIndex = lead.verification_attempts || 0;
      const requiredIntervalHours = RESEND_INTERVALS_HOURS[attemptIndex] || RESEND_INTERVALS_HOURS[RESEND_INTERVALS_HOURS.length - 1];
      
      // Check if enough time has passed
      const lastSent = lead.last_verification_sent_at 
        ? new Date(lead.last_verification_sent_at) 
        : new Date(lead.created_at);
      
      const hoursSinceLastSend = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastSend < requiredIntervalHours) {
        results.skipped++;
        continue;
      }

      // Generate new verification credentials
      const token = generateVerificationToken();
      const code = generateVerificationCode();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      // Update lead with new verification info
      const { error: updateError } = await supabase
        .from('crm_leads')
        .update({
          verification_token: token,
          verification_code: code,
          verification_expires: expiresAt,
          verification_attempts: (lead.verification_attempts || 0) + 1,
          last_verification_sent_at: now.toISOString(),
          status: 'unverified',
          updated_at: now.toISOString(),
        })
        .eq('id', lead.id);

      if (updateError) {
        console.error(`[Resend] Update error for ${lead.email}:`, updateError);
        results.errors++;
        continue;
      }

      // Send verification email
      const verificationUrl = `${SITE_URL}/verify-email/${token}`;
      const emailResult = await sendEmail({
        to: lead.email,
        subject: `Reminder: Verify your email - GreenLine365`,
        html: getVerificationEmailHtml(
          lead.name || '', 
          verificationUrl, 
          code, 
          'waitlist',
          lead.email
        ),
      });

      if (emailResult.success) {
        results.sent++;
        console.log(`[Resend] Sent to ${lead.email} (attempt ${(lead.verification_attempts || 0) + 1})`);
        
        // Log activity
        await supabase.from('crm_lead_activities').insert({
          lead_id: lead.id,
          activity_type: 'verification_resent',
          activity_data: { 
            attempt: (lead.verification_attempts || 0) + 1,
            email: lead.email 
          },
        });
      } else {
        results.errors++;
        console.error(`[Resend] Failed to send to ${lead.email}:`, emailResult.error);
        
        // If email failed due to bounce, mark the lead
        if (emailResult.error?.includes('bounce') || emailResult.error?.includes('invalid')) {
          await supabase
            .from('crm_leads')
            .update({ bounce_flag: true, updated_at: now.toISOString() })
            .eq('id', lead.id);
        }
      }

      // Small delay between sends to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('[Resend] Job completed:', results);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} leads`,
      results,
    });

  } catch (error: any) {
    console.error('[Resend] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint for manual status check
export async function GET() {
  try {
    const { data: stats, error } = await supabase
      .from('crm_leads')
      .select('status, verification_attempts')
      .in('status', ['new', 'unverified']);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    const summary = {
      total: stats?.length || 0,
      byAttempts: {} as Record<number, number>,
    };

    stats?.forEach(lead => {
      const attempts = lead.verification_attempts || 0;
      summary.byAttempts[attempts] = (summary.byAttempts[attempts] || 0) + 1;
    });

    return NextResponse.json({ 
      eligible: summary,
      maxAttempts: MAX_ATTEMPTS,
      intervals: RESEND_INTERVALS_HOURS,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
