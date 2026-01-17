/**
 * Storage Tracking API
 * POST /api/storage/track
 * 
 * Records storage usage events (uploads, deletes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TrackRequest {
  businessId: string;
  eventType: 'upload' | 'delete' | 'update';
  objectId: string;
  objectName?: string;
  deltaBytes: number;
  storageType?: string;
  mimeType?: string;
  bucketName?: string;
  metadata?: Record<string, any>;
}

// Alert thresholds
const ALERT_THRESHOLDS = [
  { percent: 50, type: '50_percent' },
  { percent: 80, type: '80_percent' },
  { percent: 90, type: '90_percent' },
  { percent: 100, type: '100_percent' },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: TrackRequest = await request.json();

    const {
      businessId,
      eventType,
      objectId,
      objectName,
      deltaBytes,
      storageType = 'file',
      mimeType,
      bucketName = 'default',
      metadata = {},
    } = body;

    // Validate required fields
    if (!businessId || !eventType || !objectId || deltaBytes === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: businessId, eventType, objectId, deltaBytes' },
        { status: 400 }
      );
    }

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this business
    const { data: access } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();

    if (!access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get current business storage info
    const { data: business } = await supabase
      .from('businesses')
      .select('current_storage_bytes, storage_limit_bytes, storage_blocked')
      .eq('id', businessId)
      .single();

    // Check if blocked (only for uploads)
    if (eventType === 'upload' && business?.storage_blocked) {
      return NextResponse.json(
        { error: 'Storage blocked. Please upgrade your plan or delete files.' },
        { status: 403 }
      );
    }

    // Calculate new total
    const currentBytes = business?.current_storage_bytes || 0;
    const newTotal = currentBytes + deltaBytes;

    // Insert the usage event
    const { data: event, error: eventError } = await supabase
      .from('storage_usage_events')
      .insert({
        tenant_id: businessId,
        event_type: eventType,
        object_id: objectId,
        object_name: objectName,
        delta_bytes: deltaBytes,
        total_bytes: newTotal,
        storage_type: storageType,
        mime_type: mimeType,
        bucket_name: bucketName,
        metadata,
        created_by: user.id,
      })
      .select()
      .single();

    if (eventError) {
      console.error('[Storage Track] Event insert error:', eventError);
      return NextResponse.json({ error: 'Failed to track storage event' }, { status: 500 });
    }

    // The trigger will update current_storage_bytes automatically
    // Now check if we need to create alerts

    const limitBytes = business?.storage_limit_bytes || 5 * 1024 * 1024 * 1024;
    const newPercent = (newTotal / limitBytes) * 100;

    // Check each threshold
    for (const threshold of ALERT_THRESHOLDS) {
      if (newPercent >= threshold.percent) {
        // Check if alert already exists for this threshold (in last 24 hours)
        const { data: existingAlert } = await supabase
          .from('storage_alerts')
          .select('id')
          .eq('tenant_id', businessId)
          .eq('alert_type', threshold.type)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .single();

        if (!existingAlert) {
          // Create new alert
          await supabase.from('storage_alerts').insert({
            tenant_id: businessId,
            alert_type: threshold.type,
            threshold_percent: threshold.percent,
            bytes_used: newTotal,
            bytes_limit: limitBytes,
            usage_percent: Math.round(newPercent * 100) / 100,
            message: getAlertMessage(threshold.percent, newTotal, limitBytes),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      event,
      newTotal,
      usagePercent: Math.round(newPercent * 100) / 100,
    });

  } catch (error: any) {
    console.error('[Storage Track API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getAlertMessage(percent: number, used: number, limit: number): string {
  const usedGB = (used / (1024 * 1024 * 1024)).toFixed(2);
  const limitGB = (limit / (1024 * 1024 * 1024)).toFixed(0);

  switch (percent) {
    case 50:
      return `You've used 50% of your storage (${usedGB}GB of ${limitGB}GB).`;
    case 80:
      return `Warning: You've used 80% of your storage (${usedGB}GB of ${limitGB}GB). Consider upgrading your plan.`;
    case 90:
      return `Alert: You've used 90% of your storage (${usedGB}GB of ${limitGB}GB). Upgrade now to avoid service interruption.`;
    case 100:
      return `Critical: You've exceeded your storage limit (${usedGB}GB of ${limitGB}GB). Overage charges will apply.`;
    default:
      return `Storage usage at ${percent}% (${usedGB}GB of ${limitGB}GB).`;
  }
}
