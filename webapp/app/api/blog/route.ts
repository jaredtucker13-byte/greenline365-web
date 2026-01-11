import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Utility function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// SEO Analysis function
function analyzeSEO(content: string, title: string) {
  const wordCount = content.split(/\s+/).filter(w => w).length;
  const hasHeadings = /#{1,6}\s/.test(content);
  const titleLength = title.length;
  
  let score = 50; // Base score
  
  // Word count (optimal: 1000-2000)
  if (wordCount >= 1000 && wordCount <= 2000) score += 20;
  else if (wordCount >= 500) score += 10;
  
  // Title length (optimal: 50-60 chars)
  if (titleLength >= 50 && titleLength <= 60) score += 15;
  else if (titleLength >= 40 && titleLength <= 70) score += 10;
  
  // Has headings
  if (hasHeadings) score += 15;
  
  return {
    score: Math.min(score, 100),
    details: {
      wordCount,
      titleLength,
      hasHeadings,
      readTime: Math.ceil(wordCount / 200),
    }
  };
}

// GET /api/blog - List all blog posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') || 'published';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let query = supabase
      .from('blog_posts')
      .select('*, blog_analytics(*)')
      .eq('status', status)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({ posts: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/blog - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags, images, status, scheduled_for, tenant_id } = body;
    
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }
    
    // Generate slug
    const slug = generateSlug(title);
    
    // Analyze SEO
    const seoAnalysis = analyzeSEO(content, title);
    
    // Extract excerpt (first 160 chars)
    const excerpt = content.substring(0, 160).trim() + '...';
    
    // Insert blog post
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        tenant_id: tenant_id || null,
        title,
        slug,
        content,
        excerpt,
        category,
        tags: tags || [],
        images: images || [],
        featured_image: images?.[0] || null,
        status: status || 'draft',
        scheduled_for: scheduled_for || null,
        published_at: status === 'published' ? new Date().toISOString() : null,
        seo_score: seoAnalysis.score,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Create analytics entry
    await supabase.from('blog_analytics').insert({
      post_id: data.id,
      views: 0,
      shares: 0,
    });
    
    return NextResponse.json({ post: data, seo: seoAnalysis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
