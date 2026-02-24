/**
 * Brain Context Graph API
 *
 * GET /api/brain/graph?businessId=...&entityType=...&entityId=...
 *   → Get all connected nodes for a given entity
 *
 * POST /api/brain/graph
 *   → Create a new edge between two entities
 *
 * DELETE /api/brain/graph?id=...
 *   → Remove an edge
 *
 * GET /api/brain/graph/entity?businessId=...&type=property&id=...
 *   → Get a full entity profile with all connections (for Commander dashboard)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    // If entity specified, get connected nodes
    if (entityType && entityId) {
      // Get outgoing edges
      const { data: outgoing, error: outErr } = await supabase
        .from('brain_edges')
        .select('*')
        .eq('business_id', businessId)
        .eq('source_type', entityType)
        .eq('source_id', entityId)
        .order('strength', { ascending: false });

      // Get incoming edges
      const { data: incoming, error: inErr } = await supabase
        .from('brain_edges')
        .select('*')
        .eq('business_id', businessId)
        .eq('target_type', entityType)
        .eq('target_id', entityId)
        .order('strength', { ascending: false });

      if (outErr || inErr) {
        return NextResponse.json({ error: 'Failed to query edges' }, { status: 500 });
      }

      return NextResponse.json({
        entity: { type: entityType, id: entityId },
        outgoing: outgoing || [],
        incoming: incoming || [],
        total_connections: (outgoing?.length || 0) + (incoming?.length || 0),
      });
    }

    // Otherwise, return recent edges for the business
    const { data: edges, error } = await supabase
      .from('brain_edges')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ edges: edges || [] });

  } catch (error: any) {
    console.error('GET /api/brain/graph error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessId,
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationship,
      strength = 1.0,
      metadata = {},
      createdBy = 'user',
    } = body;

    if (!businessId || !sourceType || !sourceId || !targetType || !targetId || !relationship) {
      return NextResponse.json(
        { error: 'businessId, sourceType, sourceId, targetType, targetId, and relationship are required' },
        { status: 400 }
      );
    }

    const { data: edge, error } = await supabase
      .from('brain_edges')
      .upsert({
        business_id: businessId,
        source_type: sourceType,
        source_id: sourceId,
        target_type: targetType,
        target_id: targetId,
        relationship,
        strength,
        metadata,
        created_by: createdBy,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'business_id,source_type,source_id,target_type,target_id,relationship',
      })
      .select()
      .single();

    if (error) {
      console.error('[Graph] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, edge });

  } catch (error: any) {
    console.error('POST /api/brain/graph error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const edgeId = searchParams.get('id');

    if (!edgeId) {
      return NextResponse.json({ error: 'Edge id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('brain_edges')
      .delete()
      .eq('id', edgeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('DELETE /api/brain/graph error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
