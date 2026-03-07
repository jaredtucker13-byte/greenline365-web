import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================
// GET - Fetch all drafts for a user (auth required)
// ============================================
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'draft';

    const { data, error } = await supabase
      .from('scheduled_content')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(20);

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
// POST - Save a new draft or scheduled content (auth required)
// ============================================
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const {
      title,
      contentType,
      contentData,
      status = 'draft',
      scheduledAt,
      platforms = ['instagram'],
    } = body;

    if (!title && !contentData?.caption) {
      return NextResponse.json({ error: 'Title or content is required' }, { status: 400 });
    }

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      title: title || contentData?.title || 'Untitled Draft',
      description: contentData?.caption || contentData?.productDescription || '',
      content_type: contentType || 'photo',
      event_type: 'content',
      scheduled_date: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
      platforms: platforms || [],
      hashtags: contentData?.hashtags
        ? [contentData.hashtags.brand, contentData.hashtags.local, ...(contentData.hashtags.optional || [])].filter(Boolean)
        : [],
      image_url: contentData?.imageUrl || null,
      status,
      color: contentType === 'blog' ? '#8B5CF6' : contentType === 'product' ? '#F59E0B' : '#0CE293',
      metadata: {
        keywords: contentData?.keywords || [],
        blogContent: contentData?.blogContent || null,
        productDescription: contentData?.productDescription || null,
        fullContentData: contentData,
      },
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
// PUT - Update an existing draft (auth required)
// ============================================
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const {
      id,
      title,
      contentType,
      contentData,
      status,
      scheduledAt,
      platforms,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (contentType !== undefined) updateData.content_type = contentType;
    if (status !== undefined) updateData.status = status;
    if (scheduledAt !== undefined) updateData.scheduled_date = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    if (platforms !== undefined) updateData.platforms = platforms;

    if (contentData !== undefined) {
      updateData.description = contentData?.caption || contentData?.productDescription || '';
      updateData.image_url = contentData?.imageUrl || null;
      updateData.hashtags = contentData?.hashtags
        ? [contentData.hashtags.brand, contentData.hashtags.local, ...(contentData.hashtags.optional || [])].filter(Boolean)
        : [];
      updateData.metadata = {
        keywords: contentData?.keywords || [],
        blogContent: contentData?.blogContent || null,
        productDescription: contentData?.productDescription || null,
        fullContentData: contentData,
      };
    }

    const { data, error } = await supabase
      .from('scheduled_content')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
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
// DELETE - Delete a draft (auth required)
// ============================================
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('scheduled_content')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

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
