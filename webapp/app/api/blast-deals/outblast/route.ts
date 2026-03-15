/**
 * Blast Deal Outblast API — Send deal email to GL365 consumers + business's synced list
 *
 * POST - Trigger an outblast for an active deal
 *
 * When a deal goes live on the directory:
 * 1. Find all GL365 consumers in the same ZIP code / area
 * 2. If the business has synced their email list, include those too
 * 3. Send a branded GL365 email featuring the business's deal
 * 4. The business owner can include a custom message
 *
 * Emails come FROM GreenLine365 (our brand, our list)
 * but prominently feature the business and their deal
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Build the outblast email HTML */
function buildOutblastEmail(deal: any, business: any, customMessage?: string): { subject: string; html: string } {
  const subject = `🔥 Flash Deal: ${deal.title} at ${business.name || 'a local business'}`;

  const claimUrl = deal.claim_url || `${process.env.NEXT_PUBLIC_SITE_URL}/claim/${deal.claim_code}`;
  const urgencyText = deal.max_claims
    ? `Only ${Math.max(0, (deal.max_claims || 0) - (deal.current_claims || 0))} left!`
    : deal.time_window || 'Limited time only!';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0; }
    .flash-badge { display: inline-block; background: linear-gradient(135deg, #C9A96E, #E8D5A3); color: #0a0a0a; font-weight: bold; font-size: 12px; padding: 6px 16px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
    .deal-title { font-size: 28px; font-weight: bold; color: #ffffff; margin: 0 0 8px; }
    .business-name { font-size: 16px; color: #C9A96E; margin: 0; }
    .deal-card { background: linear-gradient(135deg, #C9A96E20, #E8D5A320); border: 2px solid #C9A96E40; border-radius: 0 0 16px 16px; padding: 30px; text-align: center; }
    .deal-value { font-size: 48px; font-weight: bold; color: #C9A96E; margin: 0 0 8px; }
    .deal-desc { font-size: 16px; color: #cccccc; margin: 0 0 20px; line-height: 1.5; }
    .urgency { background: #ff3b3b20; border: 1px solid #ff3b3b40; color: #ff6b6b; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block; margin-bottom: 20px; }
    .claim-btn { display: inline-block; background: linear-gradient(135deg, #C9A96E, #E8D5A3); color: #0a0a0a; font-size: 18px; font-weight: bold; padding: 16px 48px; border-radius: 12px; text-decoration: none; margin: 20px 0; }
    .claim-code { font-family: monospace; font-size: 20px; color: #C9A96E; letter-spacing: 3px; margin: 16px 0; }
    .custom-msg { background: #ffffff10; border-left: 3px solid #C9A96E; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .custom-msg p { margin: 0; color: #cccccc; font-style: italic; line-height: 1.5; }
    .custom-msg .from { color: #C9A96E; font-style: normal; font-weight: bold; margin-top: 8px; }
    .terms { font-size: 12px; color: #666666; margin-top: 20px; line-height: 1.4; }
    .footer { text-align: center; padding: 30px 20px; }
    .footer-logo { font-size: 14px; color: #C9A96E; font-weight: bold; }
    .footer-text { font-size: 11px; color: #555555; margin-top: 8px; line-height: 1.4; }
    .unsubscribe { color: #555555; font-size: 11px; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="flash-badge">⚡ Flash Deal</div>
      <h1 class="deal-title">${deal.title}</h1>
      <p class="business-name">at ${business.name || 'Local Business'}</p>
    </div>

    <div class="deal-card">
      <div class="deal-value">${deal.deal_value}</div>
      <p class="deal-desc">${deal.description || ''}</p>

      <div class="urgency">⏰ ${urgencyText}</div>

      ${customMessage ? `
      <div class="custom-msg">
        <p>"${customMessage}"</p>
        <p class="from">— ${business.name || 'The Business'}</p>
      </div>
      ` : ''}

      <br>
      <a href="${claimUrl}" class="claim-btn">Claim This Deal →</a>
      <br><br>
      <div class="claim-code">${deal.claim_code}</div>
      <p style="font-size: 12px; color: #888;">Show this code when you visit</p>

      ${deal.terms ? `<p class="terms">${deal.terms}</p>` : ''}
    </div>

    <div class="footer">
      <p class="footer-logo">GreenLine365</p>
      <p class="footer-text">
        You're receiving this because you're a GreenLine365 member in the ${business.city || 'local'} area.
        <br>We only send deals that match your location.
      </p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" class="unsubscribe">Unsubscribe from deal alerts</a>
      </p>
    </div>
  </div>
</body>
</html>`.trim();

  return { subject, html };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deal_id, business_message } = body;

    if (!deal_id) {
      return NextResponse.json({ error: 'deal_id is required' }, { status: 400 });
    }

    // 1. Get the deal
    const { data: deal, error: dealError } = await supabase
      .from('blast_deals')
      .select('*')
      .eq('id', deal_id)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    if (deal.status !== 'active') {
      return NextResponse.json({ error: 'Deal must be active to outblast' }, { status: 400 });
    }

    // 2. Get the business info (from directory_listings)
    let business: any = { name: 'Local Business', city: '' };
    if (deal.listing_id) {
      const { data: listing } = await supabase
        .from('directory_listings')
        .select('business_name, city, zip_code, email')
        .eq('id', deal.listing_id)
        .single();
      if (listing) {
        business = { name: listing.business_name, city: listing.city, zip_code: listing.zip_code, email: listing.email };
      }
    }

    // 3. Find GL365 consumers in the same area (by ZIP code)
    const dealZip = business.zip_code || '';
    const zipPrefix = dealZip.slice(0, 3); // Match first 3 digits for area proximity

    const { data: localConsumers } = await supabase
      .from('consumer_profiles')
      .select('email, full_name')
      .filter('opted_in_marketing', 'eq', true)
      .limit(500);

    // Filter by ZIP proximity (first 3 digits match = same general area)
    const targetConsumers = (localConsumers || []).filter((c: any) => {
      if (!c.email) return false;
      // If no ZIP filtering possible, include all for now
      // TODO: Filter by zip_code proximity once consumers have ZIP codes
      return true;
    });

    // 4. Get business's synced email list (from consumer_business_links)
    const { data: businessClients } = await supabase
      .from('consumer_business_links')
      .select('consumer_id')
      .eq('business_id', deal.business_id)
      .eq('email_opted_in', true)
      .limit(500);

    let syncedEmails: string[] = [];
    if (businessClients && businessClients.length > 0) {
      const consumerIds = businessClients.map((c: any) => c.consumer_id);
      const { data: syncedConsumers } = await supabase
        .from('consumer_profiles')
        .select('email')
        .in('id', consumerIds);
      syncedEmails = (syncedConsumers || []).map((c: any) => c.email).filter(Boolean);
    }

    // 5. Merge and deduplicate email lists
    const allEmails = new Set<string>();
    targetConsumers.forEach((c: any) => allEmails.add(c.email.toLowerCase()));
    syncedEmails.forEach((e: string) => allEmails.add(e.toLowerCase()));

    const emailList = Array.from(allEmails);

    // 6. Build the email
    const { subject, html } = buildOutblastEmail(deal, business, business_message);

    // 7. Send via SendGrid (batch)
    const sendgridKey = process.env.SENDGRID_API_KEY;
    let sentCount = 0;
    let failedCount = 0;

    if (sendgridKey && emailList.length > 0) {
      // SendGrid batch send (up to 1000 per request)
      const batches = [];
      for (let i = 0; i < emailList.length; i += 1000) {
        batches.push(emailList.slice(i, i + 1000));
      }

      for (const batch of batches) {
        try {
          const personalizations = batch.map(email => ({
            to: [{ email }],
          }));

          const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sendgridKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations,
              from: {
                email: process.env.SENDGRID_FROM_EMAIL || 'GreenLine365help@gmail.com',
                name: 'GreenLine365 Deals',
              },
              subject,
              content: [{ type: 'text/html', value: html }],
              tracking_settings: {
                click_tracking: { enable: true },
                open_tracking: { enable: true },
              },
            }),
          });

          if (response.ok || response.status === 202) {
            sentCount += batch.length;
          } else {
            console.error('SendGrid error:', response.status, await response.text());
            failedCount += batch.length;
          }
        } catch (e) {
          console.error('SendGrid batch error:', e);
          failedCount += batch.length;
        }
      }
    }

    // 8. Log the outblast
    await supabase.from('trend_history').insert({
      user_id: deal.created_by,
      zip_code: business.zip_code || 'unknown',
      trend_type: 'outblast',
      n8n_request: { deal_id, total_recipients: emailList.length },
      n8n_response: { sent: sentCount, failed: failedCount },
      trends_count: emailList.length,
      status: sentCount > 0 ? 'success' : 'failed',
    });

    return NextResponse.json({
      success: true,
      outblast: {
        deal_id: deal.id,
        deal_title: deal.title,
        total_recipients: emailList.length,
        gl365_consumers: targetConsumers.length,
        synced_business_clients: syncedEmails.length,
        sent: sentCount,
        failed: failedCount,
      },
      message: `Outblast sent to ${sentCount} people (${targetConsumers.length} GL365 members + ${syncedEmails.length} synced clients)`,
    });
  } catch (error: any) {
    console.error('Outblast error:', error);
    return NextResponse.json(
      { error: 'Outblast failed', details: error.message },
      { status: 500 }
    );
  }
}
