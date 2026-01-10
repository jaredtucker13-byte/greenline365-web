import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// GET - Fetch all drafts for a user
// ============================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'draft'; // 'draft', 'scheduled', 'published'
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('scheduled_content')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      drafts: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('GET drafts error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================================
// POST - Save a new draft or scheduled content
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      userId,
      title,
      contentType, // 'photo', 'product', 'blog'
      contentData, // Full content object (caption, keywords, hashtags, etc.)
      status = 'draft', // 'draft', 'scheduled', 'published'
      scheduledAt,
      platforms = ['instagram'],
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!title && !contentData?.caption) {
      return NextResponse.json({ error: 'Title or content is required' }, { status: 400 });
    }

    const insertData = {
      user_id: userId,
      title: title || contentData?.title || 'Untitled Draft',
      content_type: contentType || 'photo',
      content_data: contentData,
      status,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      platforms,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('scheduled_content')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: status === 'draft' ? 'Draft saved successfully' : 'Content scheduled successfully',
      draft: data
    });

  } catch (error) {
    console.error('POST draft error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================================
// PUT - Update an existing draft
// ============================================
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      id,
      userId,
      title,
      contentType,
      contentData,
      status,
      scheduledAt,
      platforms,
    } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (contentType !== undefined) updateData.content_type = contentType;
    if (contentData !== undefined) updateData.content_data = contentData;
    if (status !== undefined) updateData.status = status;
    if (scheduledAt !== undefined) updateData.scheduled_at = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    if (platforms !== undefined) updateData.platforms = platforms;

    const { data, error } = await supabase
      .from('scheduled_content')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Draft updated successfully',
      draft: data
    });

  } catch (error) {
    console.error('PUT draft error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ============================================
// DELETE - Delete a draft
// ============================================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json({ error: 'id and userId are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('scheduled_content')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Draft deleted successfully'
    });

  } catch (error) {
    console.error('DELETE draft error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
