/**
 * Track Resource Download
 * POST /api/destination/resources/download
 *
 * Increments the download count and logs the download event.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { resourceId } = await request.json();
    if (!resourceId) return NextResponse.json({ error: 'resourceId required' }, { status: 400 });

    // Get the resource to find its listing_id
    const { data: resource } = await supabase
      .from('resource_links')
      .select('id, listing_id')
      .eq('id', resourceId)
      .single();

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Hash the IP for privacy
    const forwarded = request.headers.get('x-forwarded-for') || '';
    const ip = forwarded.split(',')[0]?.trim() || 'unknown';
    const ipHash = createHash('sha256').update(ip + process.env.SUPABASE_SERVICE_ROLE_KEY).digest('hex').slice(0, 16);

    // Increment counter (atomic)
    try {
      await supabase.rpc('increment_download_count', { p_resource_id: resourceId });
    } catch {
      // Fallback if RPC doesn't exist
      await supabase
        .from('resource_links')
        .update({ download_count: (resource as any).download_count + 1 })
        .eq('id', resourceId);
    }

    // Log the download event
    try {
      await supabase.from('resource_downloads').insert({
        resource_id: resourceId,
        listing_id: resource.listing_id,
        ip_hash: ipHash,
        user_agent: request.headers.get('user-agent')?.slice(0, 200) || null,
        referer: request.headers.get('referer')?.slice(0, 200) || null,
      });
    } catch { /* logging is best-effort */ }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
