import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Style preset interface
interface StylePreset {
  id?: string;
  tenant_id?: string;
  user_id?: string;
  name: string;
  description?: string;
  style_guide: any;
  tags?: string[];
  is_default?: boolean;
  times_used?: number;
  created_at?: string;
  updated_at?: string;
}

// GET - Fetch all style presets for user/tenant
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenant_id');
    const includeDefaults = searchParams.get('include_defaults') === 'true';

    let query = supabase
      .from('style_presets')
      .select('*')
      .order('times_used', { ascending: false })
      .order('created_at', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      // Table might not exist yet
      if (error.code === 'PGRST205' || error.message.includes('style_presets')) {
        return NextResponse.json({ 
          presets: [],
          tableExists: false,
          message: 'Style presets table not found. Please run the migration.'
        });
      }
      throw error;
    }

    return NextResponse.json({ 
      presets: data || [],
      tableExists: true
    });
  } catch (error: any) {
    console.error('[Styles API] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch style presets' },
      { status: 500 }
    );
  }
}

// POST - Create a new style preset
export async function POST(request: NextRequest) {
  try {
    const body: StylePreset = await request.json();

    if (!body.name || !body.style_guide) {
      return NextResponse.json(
        { error: 'Name and style_guide are required' },
        { status: 400 }
      );
    }

    // If setting as default, we handle that via DB trigger
    const { data, error } = await supabase
      .from('style_presets')
      .insert({
        tenant_id: body.tenant_id || null,
        user_id: body.user_id || null,
        name: body.name,
        description: body.description || body.style_guide.description || '',
        style_guide: body.style_guide,
        tags: body.tags || [],
        is_default: body.is_default || false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('style_presets')) {
        return NextResponse.json({ 
          error: 'Style presets table not found. Please run the database migration first.',
          migrationRequired: true
        }, { status: 503 });
      }
      throw error;
    }

    return NextResponse.json({ 
      success: true,
      preset: data,
      message: `Style "${body.name}" saved to your library!`
    });
  } catch (error: any) {
    console.error('[Styles API] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save style preset' },
      { status: 500 }
    );
  }
}

// PUT - Update a style preset
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('style_presets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      preset: data,
      message: 'Style updated successfully'
    });
  } catch (error: any) {
    console.error('[Styles API] PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update style preset' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a style preset
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('style_presets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      message: 'Style removed from library'
    });
  } catch (error: any) {
    console.error('[Styles API] DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete style preset' },
      { status: 500 }
    );
  }
}
