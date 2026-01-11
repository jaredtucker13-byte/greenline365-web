import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();
  
  if (!post) return { title: 'Post Not Found' };
  
  return {
    title: post.title,
    description: post.meta_description || post.excerpt,
    keywords: post.meta_keywords,
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image ? [post.featured_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*, blog_analytics(*)')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();
  
  if (!post) {
    notFound();
  }
  
  // Get related posts
  const { data: relatedPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .eq('category', post.category)
    .neq('id', post.id)
    .limit(3);
  
  const readTime = Math.ceil((post.content?.split(/\s+/).length || 0) / 200);
  
  return (
    <main className=\"min-h-screen bg-os-dark pt-24 pb-20\">
      <article className=\"max-w-[900px] mx-auto px-4 sm:px-6\">
        {/* Back to Blog */}
        <Link
          href=\"/blog\"
          className=\"inline-flex items-center gap-2 text-white/70 hover:text-neon-green-500 transition-colors mb-8 text-sm\"
        >
          <svg className=\"w-4 h-4\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">
            <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M15 19l-7-7 7-7\" />
          </svg>
          Back to Blog
        </Link>
        
        {/* Category */}
        {post.category && (
          <div className=\"text-neon-green-400 text-sm font-semibold mb-4 uppercase tracking-wide\">
            {post.category}
          </div>
        )}
        
        {/* Title */}
        <h1 className=\"font-display font-bold text-white mb-6\" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: '1.2' }}>
          {post.title}
        </h1>
        
        {/* Meta */}
        <div className=\"flex items-center gap-6 text-white/50 text-sm mb-8 pb-8 border-b border-white/10\">
          <span>
            {new Date(post.published_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          <span>⏱ {readTime} min read</span>
          <span>👁 {post.blog_analytics?.[0]?.views || 0} views</span>
        </div>
        
        {/* Featured Image */}
        {post.featured_image && (
          <div className=\"aspect-video bg-white/5 rounded-lg mb-12 overflow-hidden\">
            <img
              src={post.featured_image}
              alt={post.title}
              className=\"w-full h-full object-cover\"
            />
          </div>
        )}
        
        {/* Content */}
        <div className=\"prose prose-invert prose-lg max-w-none\">
          <div
            className=\"text-white/90 leading-relaxed\"
            style={{
              fontSize: '1.125rem',
              lineHeight: '1.75'
            }}
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\\n/g, '<br />') }}
          />
        </div>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className=\"flex flex-wrap gap-2 mt-12 pt-12 border-t border-white/10\">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className=\"px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60 text-xs\"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
      
      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className=\"max-w-[1200px] mx-auto px-4 sm:px-6 mt-20\">
          <h2 className=\"font-display font-bold text-white text-2xl mb-8\">
            Related Posts
          </h2>
          <div className=\"grid md:grid-cols-3 gap-8\">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className=\"os-card p-6 hover:-translate-y-1 transition-all duration-300 group\"
              >
                <h3 className=\"text-white font-bold text-lg mb-2 group-hover:text-neon-green-500 transition-colors\">
                  {related.title}
                </h3>
                <p className=\"text-white/70 text-sm line-clamp-2\">{related.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
