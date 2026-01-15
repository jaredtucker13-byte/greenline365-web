import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Brand Voice API (Layer 1 - Identity)
 * Multi-tenant enabled
 * 
 * Actions:
 * - get: Get all identity chunks for active business
 * - set: Set/update identity chunks
 * - update: Update business brand_voice JSONB field
 */

interface IdentityChunk {
  category: 'tone' | 'values' | 'mission' | 'voice_examples' | 'brand_story' | 'target_audience' | 'positioning';
  key: string;
  value: string;
  priority?: number;
  metadata?: Record<string, any>;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      );
    }

    // Verify user has access to this business
    const { data: access } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();

    if (!access) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get identity chunks
    const { data: chunks, error } = await supabase
      .from('memory_identity_chunks')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.error('[Brand Voice API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get business brand_voice field
    const { data: business } = await supabase
      .from('businesses')
      .select('brand_voice, settings')
      .eq('id', businessId)
      .single();

    return NextResponse.json({
      chunks: chunks || [],
      brand_voice: business?.brand_voice || {},
      settings: business?.settings || {},
    });

  } catch (error: any) {
    console.error('[Brand Voice API] Error:', error);
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
    const { action, businessId, chunks, brand_voice } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID required' },
        { status: 400 }
      );
    }

    // Verify user has access
    const { data: access } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single();

    if (!access || !['owner', 'admin'].includes(access.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'set':
        return setIdentityChunks(supabase, user.id, businessId, chunks);
      case 'update':
        return updateBrandVoice(supabase, businessId, brand_voice);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[Brand Voice API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function setIdentityChunks(
  supabase: any,
  userId: string,
  businessId: string,
  chunks: IdentityChunk[]
) {
  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    return NextResponse.json(
      { error: 'No chunks provided' },
      { status: 400 }
    );
  }

  const insertData = chunks.map(chunk => ({
    business_id: businessId,
    category: chunk.category,
    key: chunk.key,
    value: chunk.value,
    priority: chunk.priority || 5,
    metadata: chunk.metadata || {},
    created_by: userId,
  }));

  const { data, error } = await supabase
    .from('memory_identity_chunks')
    .insert(insertData)
    .select();

  if (error) {
    console.error('[Brand Voice API] Insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    inserted: data.length,
    chunks: data,
  });
}

async function updateBrandVoice(
  supabase: any,
  businessId: string,
  brand_voice: Record<string, any>
) {
  if (!brand_voice || typeof brand_voice !== 'object') {
    return NextResponse.json(
      { error: 'Invalid brand_voice data' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('businesses')
    .update({
      brand_voice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', businessId)
    .select('brand_voice')
    .single();

  if (error) {
    console.error('[Brand Voice API] Update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    brand_voice: data.brand_voice,
  });
}
