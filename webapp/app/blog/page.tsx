import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function BlogListingPage() {
  // Fetch published posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*, blog_analytics(*)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);
  
  // Fetch categories
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name');
  
  return (
    <main className="min-h-screen bg-os-dark pt-24 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
            The <span className="text-neon-green-500">GreenLine365</span> Blog
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Raw truth, tactical insights, and zero BS advice for local business owners who refuse to stay comfortable.
          </p>
        </div>
        
        {/* Categories */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <Link
              href="/blog"
              className="px-4 py-2 rounded-full bg-neon-green-500/20 border border-neon-green-500/40 text-neon-green-400 hover:bg-neon-green-500/30 transition-colors text-sm font-medium"
            >
              All Posts
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog/category/${cat.slug}`}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:border-neon-green-500/40 hover:text-neon-green-400 transition-colors text-sm font-medium"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
        
        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="os-card p-6 hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Featured Image */}
                {post.featured_image && (
                  <div className="aspect-video bg-white/5 rounded-lg mb-4 overflow-hidden">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                {/* Category */}
                {post.category && (
                  <div className="text-neon-green-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                    {post.category}
                  </div>
                )}
                
                {/* Title */}
                <h2 className="text-white font-bold text-xl mb-3 group-hover:text-neon-green-500 transition-colors">
                  {post.title}
                </h2>
                
                {/* Excerpt */}
                <p className="text-white/70 text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>
                    {new Date(post.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="flex items-center gap-4">
                    <span>👁 {post.blog_analytics?.[0]?.views || 0}</span>
                    <span>⏱ {Math.ceil((post.content?.split(/\s+/).length || 0) / 200)} min</span>
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <p className="text-white/50 text-lg">No blog posts yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
