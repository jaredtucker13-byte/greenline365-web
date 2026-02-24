/**
 * Home Ledger Equipment Decay Scanner
 *
 * Runs monthly. Scans all properties with equipment data in the
 * Home Ledger for assets approaching end-of-life. Triggers
 * personalized Value Bomb emails at 3 escalation levels.
 *
 * This is Lead Source #3 — the zero-cost acquisition flywheel.
 * No ad spend. No outbound calls. Just data-driven outreach
 * to existing GL365 homeowners based on equipment lifecycle intelligence.
 *
 * GET /api/cron/decay-scanner
 *   Protected by CRON_SECRET.
 *
 * Trigger levels:
 *   85% of lifespan → "Awareness" email
 *   95% of lifespan → "Urgency" email
 *   110% of lifespan → "Critical" email + optional Scout outbound
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { notify } from '@/lib/notifications';

// Industry-standard equipment lifespans (years)
const EQUIPMENT_LIFESPANS: Record<string, number> = {
  'HVAC': 15,
  'hvac': 15,
  'air_conditioner': 15,
  'ac': 15,
  'furnace': 20,
  'heat_pump': 15,
  'roof': 25,
  'shingle_roof': 20,
  'tile_roof': 50,
  'metal_roof': 40,
  'water_heater': 10,
  'tankless_water_heater': 20,
  'electrical_panel': 30,
  'electrical': 30,
  'plumbing': 40,
  'sewer_line': 50,
  'windows': 20,
  'garage_door': 15,
  'insulation': 25,
};

// Threshold percentages for each trigger level
const THRESHOLDS = {
  awareness: 0.85,
  urgency: 0.95,
  critical: 1.10,
};

interface DecayScanResult {
  propertiesScanned: number;
  assetsEvaluated: number;
  triggers: {
    awareness: number;
    urgency: number;
    critical: number;
  };
  leadsCreated: number;
  errors: number;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const result: DecayScanResult = {
    propertiesScanned: 0,
    assetsEvaluated: 0,
    triggers: { awareness: 0, urgency: 0, critical: 0 },
    leadsCreated: 0,
    errors: 0,
  };

  try {
    // Fetch all properties that have asset_inventory data
    const { data: properties, error: fetchError } = await supabase
      .from('properties')
      .select('id, address, asset_inventory, owner_name, owner_email, owner_phone')
      .not('asset_inventory', 'is', null)
      .limit(500); // Process in batches of 500

    if (fetchError || !properties?.length) {
      return NextResponse.json({
        message: 'No properties with asset data found',
        result,
      });
    }

    result.propertiesScanned = properties.length;

    for (const property of properties) {
      try {
        const assets = Array.isArray(property.asset_inventory)
          ? property.asset_inventory
          : [];

        for (const asset of assets) {
          result.assetsEvaluated++;

          const assetType = asset.type?.toLowerCase();
          const lifespan = EQUIPMENT_LIFESPANS[assetType];
          if (!lifespan) continue;

          // Calculate age from install_date or estimated_age
          let ageYears: number | null = null;
          if (asset.install_date) {
            const installDate = new Date(asset.install_date);
            ageYears = (Date.now() - installDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          } else if (asset.estimated_age) {
            ageYears = asset.estimated_age;
          }

          if (ageYears === null || ageYears < 0) continue;

          const lifePercentage = ageYears / lifespan;

          // Determine trigger level
          let triggerLevel: 'awareness' | 'urgency' | 'critical' | null = null;
          if (lifePercentage >= THRESHOLDS.critical) {
            triggerLevel = 'critical';
          } else if (lifePercentage >= THRESHOLDS.urgency) {
            triggerLevel = 'urgency';
          } else if (lifePercentage >= THRESHOLDS.awareness) {
            triggerLevel = 'awareness';
          }

          if (!triggerLevel) continue;

          // Check if we already sent this trigger level for this asset
          const { data: existing } = await supabase
            .from('decay_trigger_log')
            .select('id')
            .eq('property_id', property.id)
            .eq('asset_type', assetType)
            .eq('trigger_level', triggerLevel)
            .limit(1)
            .single();

          if (existing) continue; // Already triggered

          // Log the trigger
          const { data: triggerLog } = await supabase
            .from('decay_trigger_log')
            .insert({
              property_id: property.id,
              asset_type: assetType,
              asset_age_years: Math.round(ageYears * 10) / 10,
              lifespan_years: lifespan,
              life_percentage: Math.round(lifePercentage * 100) / 100,
              trigger_level: triggerLevel,
              email_sent_at: property.owner_email ? new Date().toISOString() : null,
            })
            .select('id')
            .single();

          result.triggers[triggerLevel]++;

          // Queue the email if we have the homeowner's email
          if (property.owner_email) {
            await queueDecayEmail(supabase, {
              propertyId: property.id,
              address: property.address,
              ownerName: property.owner_name || 'Homeowner',
              ownerEmail: property.owner_email,
              ownerPhone: property.owner_phone,
              assetType: asset.type || assetType,
              ageYears: Math.round(ageYears * 10) / 10,
              lifespanYears: lifespan,
              lifePercentage: Math.round(lifePercentage * 100),
              triggerLevel,
              triggerId: triggerLog?.id,
            });
          }

          // For critical triggers with a phone number, queue for Scout outbound
          if (triggerLevel === 'critical' && property.owner_phone) {
            await supabase.from('memory_event_journal').insert({
              event_type: 'decay_outbound_queue',
              event_category: 'lead',
              title: `Critical decay: ${asset.type} at ${property.address}`,
              description: `${asset.type} is ${Math.round(lifePercentage * 100)}% of lifespan (${Math.round(ageYears)} years old, expected ${lifespan} years). Queue for Scout outbound call.`,
              metadata: {
                property_id: property.id,
                owner_phone: property.owner_phone,
                owner_name: property.owner_name,
                asset_type: assetType,
                age_years: ageYears,
                trigger_id: triggerLog?.id,
              },
              tags: ['decay_critical', 'scout_outbound', `asset:${assetType}`],
              search_text: `${property.address} ${property.owner_name} ${assetType} decay critical`,
              ai_generated: false,
            }).then(() => {}).catch(() => {});
          }
        }
      } catch (propError) {
        result.errors++;
        console.warn(`[Decay Scanner] Error on property ${property.id}:`, propError);
      }
    }

    // Notify platform owner with scan summary
    const totalTriggers = result.triggers.awareness + result.triggers.urgency + result.triggers.critical;
    if (totalTriggers > 0) {
      await supabase.from('memory_event_journal').insert({
        event_type: 'owner_notification',
        event_category: 'system',
        title: `Decay Scanner: ${totalTriggers} triggers fired`,
        description: [
          `Scanned ${result.propertiesScanned} properties, ${result.assetsEvaluated} assets.`,
          `Awareness: ${result.triggers.awareness}`,
          `Urgency: ${result.triggers.urgency}`,
          `Critical: ${result.triggers.critical}`,
          `Potential revenue: ${totalTriggers} × $1,800 = $${totalTriggers * 1800}`,
        ].join('\n'),
        metadata: { ...result, recipient: 'jared.tucker13@gmail.com' },
        tags: ['notify_owner', 'decay_scanner', 'monthly_report'],
        search_text: 'decay scanner monthly report',
        ai_generated: false,
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[Decay Scanner] Fatal error:', error);
    return NextResponse.json({ error: error.message, result }, { status: 500 });
  }
}

// ── Email Queuing ──────────────────────────────────────────────────

interface DecayEmailParams {
  propertyId: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  assetType: string;
  ageYears: number;
  lifespanYears: number;
  lifePercentage: number; // 85, 95, 110, etc.
  triggerLevel: 'awareness' | 'urgency' | 'critical';
  triggerId?: string;
}

async function queueDecayEmail(supabase: any, params: DecayEmailParams): Promise<void> {
  try {
    const subject = getDecayEmailSubject(params);
    const body = getDecayEmailBody(params);

    // Store in memory_event_journal as an email queue entry
    // The notification-email-fallback cron picks these up and sends them
    await supabase.from('memory_event_journal').insert({
      event_type: 'decay_email_queued',
      event_category: 'lead',
      title: subject,
      description: body.substring(0, 500),
      metadata: {
        recipient_email: params.ownerEmail,
        recipient_name: params.ownerName,
        subject,
        body,
        property_id: params.propertyId,
        trigger_id: params.triggerId,
        trigger_level: params.triggerLevel,
        asset_type: params.assetType,
      },
      tags: [`decay_${params.triggerLevel}`, `asset:${params.assetType}`, 'email_queue'],
      search_text: `${params.ownerName} ${params.address} ${params.assetType} decay email`,
      ai_generated: false,
    });

    // TODO: Wire actual email send via Resend/SendGrid
    // await resend.emails.send({
    //   from: 'Scout <scout@greenline365.com>',
    //   to: params.ownerEmail,
    //   subject,
    //   html: renderDecayEmailTemplate(params),
    // });
  } catch {
    // Non-critical
  }
}

function getDecayEmailSubject(params: DecayEmailParams): string {
  switch (params.triggerLevel) {
    case 'awareness':
      return `Your ${params.assetType} at ${params.address} is entering its final years`;
    case 'urgency':
      return `Your ${params.assetType} is now ${params.lifePercentage}% past its expected lifespan`;
    case 'critical':
      return `${params.ownerName}, your ${params.assetType} has outlived its expected lifespan`;
  }
}

function getDecayEmailBody(params: DecayEmailParams): string {
  const remainingLife = Math.max(0, params.lifespanYears - params.ageYears);

  switch (params.triggerLevel) {
    case 'awareness':
      return [
        `Hey ${params.ownerName},`,
        ``,
        `Just a heads-up from your GreenLine365 Home Ledger. Your ${params.assetType} was installed approximately ${params.ageYears} years ago. The industry-standard lifespan for that type of unit is ${params.lifespanYears} years — which means yours is about ${params.lifePercentage}% through its expected life.`,
        ``,
        `No action needed right now — just wanted you to have the data. The numbers are the numbers.`,
        ``,
        `Want to see your full Home Savings Report? We can calculate exactly how much your home is costing you compared to homes with modern equipment.`,
        ``,
        `— Scout, GreenLine365 Home Advisor`,
      ].join('\n');

    case 'urgency':
      return [
        `Hey ${params.ownerName},`,
        ``,
        `Quick update on your ${params.assetType} at ${params.address}. It's now ${params.ageYears} years old — ${params.lifePercentage}% through its expected ${params.lifespanYears}-year lifespan.`,
        ``,
        `Here's the part most homeowners don't know: when these units fail unexpectedly, the emergency replacement typically costs 30-50% more than a planned replacement.`,
        ``,
        `If you want a professional to take a look — no pressure, no obligation — we can connect you with a GL365 Verified Contractor who will give you an honest assessment.`,
        ``,
        `— Scout, GreenLine365 Home Advisor`,
      ].join('\n');

    case 'critical':
      return [
        `Hey ${params.ownerName},`,
        ``,
        `Your ${params.assetType} at ${params.address} is now ${params.ageYears} years old. The expected lifespan was ${params.lifespanYears} years. Most units this age have already been replaced.`,
        ``,
        `I'm not saying this to scare you — the numbers are the numbers.`,
        ``,
        `If you'd like a Verified Contractor to take a look, the assessment is free and there's zero obligation. These are contractors we've personally vetted — decades in business, insured, and accountability-verified on our platform.`,
        ``,
        `— Scout, GreenLine365 Home Advisor`,
      ].join('\n');
  }
}
