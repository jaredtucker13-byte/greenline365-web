// Cron: Trend Scanner — Runs every 3 hours via Vercel Cron
//
// 1. Scans for new local trends using Perplexity via OpenRouter
// 2. Expires stale deals
// 3. Processes pending email sequences for deal claims
//
// Configure in vercel.json: schedule "0 every-3-hours * * *"
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify this is a legit cron call (Vercel sends authorization header)
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, require it
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  // In development, allow all requests
  return true;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    tasks: {},
  };

  // Task 1: Scan for new trends for active ZIP codes
  try {
    // Get ZIP codes with active businesses/consumers
    const activeZips = ['33619']; // Default: Tampa. TODO: Query from active listings

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    for (const zipCode of activeZips) {
      const scanResponse = await fetch(`${siteUrl}/api/daily-trend-hunter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipCode,
          userId: null,
          source: 'cron_3h',
        }),
      });

      const scanData = await scanResponse.json();
      results.tasks[`scan_${zipCode}`] = {
        success: scanData.success,
        trendsFound: scanData.trends?.length || 0,
        source: scanData.metadata?.source,
      };
    }
  } catch (error: any) {
    results.tasks.trend_scan = { error: error.message };
  }

  // Task 2: Expire stale deals
  try {
    const { data: expiredDeals, error } = await supabase
      .from('blast_deals')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .select('id');

    results.tasks.expire_deals = {
      expired: expiredDeals?.length || 0,
      error: error?.message || null,
    };
  } catch (error: any) {
    results.tasks.expire_deals = { error: error.message };
  }

  // Task 3: Process pending email sequences for deal claims
  try {
    // Find claims that need their next email
    const { data: pendingClaims } = await supabase
      .from('deal_claims')
      .select('id, deal_id, consumer_email, consumer_name, sequence_status, claimed_at, last_email_sent_at')
      .not('sequence_status', 'in', '("completed","opted_out")')
      .limit(100);

    let sequencesSent = 0;

    if (pendingClaims && pendingClaims.length > 0) {
      // Get sequence templates
      const { data: sequences } = await supabase
        .from('deal_claim_sequences')
        .select('*')
        .eq('is_active', true)
        .order('step_number', { ascending: true });

      for (const claim of pendingClaims) {
        const now = new Date();
        const claimedAt = new Date(claim.claimed_at);
        const hoursSinceClaim = (now.getTime() - claimedAt.getTime()) / (1000 * 60 * 60);

        // Determine which email to send next
        let nextStep = 1;
        if (claim.sequence_status === 'email_1_sent') nextStep = 2;
        if (claim.sequence_status === 'email_2_sent') nextStep = 3;
        if (claim.sequence_status === 'pending') nextStep = 1;

        const stepTemplate = sequences?.find(s => s.step_number === nextStep);
        if (!stepTemplate) continue;

        // Check if enough time has passed
        if (hoursSinceClaim < stepTemplate.delay_hours) continue;

        // Check if we already sent this step recently (prevent double-sends)
        if (claim.last_email_sent_at) {
          const hoursSinceLastEmail = (now.getTime() - new Date(claim.last_email_sent_at).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastEmail < 1) continue; // At least 1 hour between emails
        }

        // Get deal + business info for merge fields
        const { data: deal } = await supabase
          .from('blast_deals')
          .select('title, description, claim_code, expires_at, business_id, listing_id')
          .eq('id', claim.deal_id)
          .single();

        if (!deal) continue;

        let businessName = 'a local business';
        if (deal.listing_id) {
          const { data: listing } = await supabase
            .from('directory_listings')
            .select('business_name')
            .eq('id', deal.listing_id)
            .single();
          if (listing) businessName = listing.business_name;
        }

        // Build email from template with merge fields
        const mergeFields: Record<string, string> = {
          '{{business_name}}': businessName,
          '{{consumer_name}}': claim.consumer_name || 'there',
          '{{deal_title}}': deal.title || 'your deal',
          '{{deal_description}}': deal.description || '',
          '{{deal_expires}}': new Date(deal.expires_at).toLocaleDateString(),
          '{{claim_code}}': deal.claim_code || '',
          '{{claim_date}}': new Date(claim.claimed_at).toLocaleDateString(),
        };

        let emailSubject = stepTemplate.subject_template;
        let emailBody = stepTemplate.body_template;

        for (const [field, value] of Object.entries(mergeFields)) {
          emailSubject = emailSubject.replace(new RegExp(field.replace(/[{}]/g, '\\$&'), 'g'), value);
          emailBody = emailBody.replace(new RegExp(field.replace(/[{}]/g, '\\$&'), 'g'), value);
        }

        // Send via SendGrid
        const sendgridKey = process.env.SENDGRID_API_KEY;
        if (sendgridKey) {
          const sendResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sendgridKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: claim.consumer_email }] }],
              from: {
                email: process.env.SENDGRID_FROM_EMAIL || 'deals@greenline365.com',
                name: 'GreenLine365',
              },
              subject: emailSubject,
              content: [{ type: 'text/plain', value: emailBody }],
            }),
          });

          if (sendResponse.ok || sendResponse.status === 202) {
            // Update claim status
            const newStatus = nextStep >= 3 ? 'completed' : `email_${nextStep}_sent`;
            await supabase
              .from('deal_claims')
              .update({
                sequence_status: newStatus,
                last_email_sent_at: now.toISOString(),
                sequence_started_at: claim.sequence_started_at || now.toISOString(),
              })
              .eq('id', claim.id);

            sequencesSent++;
          }
        }
      }
    }

    results.tasks.email_sequences = {
      pending_claims: pendingClaims?.length || 0,
      emails_sent: sequencesSent,
    };
  } catch (error: any) {
    results.tasks.email_sequences = { error: error.message };
  }

  return NextResponse.json({
    success: true,
    ...results,
  });
}
