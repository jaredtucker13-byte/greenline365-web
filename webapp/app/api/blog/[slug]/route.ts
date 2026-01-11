import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/blog/[slug] - Get single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, blog_analytics(*)')
      .eq('slug', params.slug)
      .single();
    
    if (error) throw error;
    
    // Increment view count
    if (data) {
      await supabase
        .from('blog_analytics')
        .update({ views: (data.blog_analytics?.[0]?.views || 0) + 1 })
        .eq('post_id', data.id);
    }
    
    return NextResponse.json({ post: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

// PATCH /api/blog/[slug] - Update blog post
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', params.slug)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ post: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/blog/[slug] - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('slug', params.slug);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
