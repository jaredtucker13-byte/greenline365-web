import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Metadata } from 'next';

// Don't try to statically generate this page — fetch blog data on each request
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog | GreenLine365 - Marketing Insights for Local Businesses',
  description: 'Expert marketing tips, automation strategies, and business growth insights for local businesses. Stay ahead with the latest trends.',
  openGraph: {
    title: 'GreenLine365 Blog',
    description: 'Marketing insights and strategies for local business success',
    type: 'website',
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface StyleGuide {
  themeName?: string;
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    background: string;
    text: string;
  };
  mood?: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: string;
  status: string;
  featured_image?: string;
  style_guide?: StyleGuide;
  created_at: string;
  published_at?: string;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  // First try published posts
  const { data: publishedPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (publishedPosts && publishedPosts.length > 0) {
    return publishedPosts;
  }

  // Fallback to all posts for demo purposes
  const { data: allPosts } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(12);
    
  return allPosts || [];
}

function generateExcerpt(content: string, maxLength: number = 150): string {
  const cleaned = content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + '...';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Beautiful color palette preview
function ColorBar({ colors }: { colors: Record<string, string> }) {
  const colorList = Object.values(colors).filter(c => c && typeof c === 'string' && c.startsWith('#')).slice(0, 5);
  if (colorList.length === 0) return null;
  
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden">
      {colorList.map((color, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

export default async function BlogListingPage() {
  const posts = await getBlogPosts();
  
  // Get unique categories
  const categories = [...new Set(posts.map(p => p.category).filter(Boolean))];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            {/* Back to home */}
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition mb-8 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to GreenLine365
            </Link>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              The{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                GreenLine365
              </span>
              {' '}Blog
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              Raw truth, tactical insights, and zero BS advice for local business owners who refuse to stay comfortable.
            </p>
            
            {/* Category Pills */}
            {categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-medium border border-emerald-500/30 cursor-pointer">
                  All Posts
                </span>
                {categories.map((category) => (
                  <span
                    key={category}
                    className="px-4 py-2 rounded-full bg-white/5 text-slate-400 text-sm font-medium border border-white/10 hover:bg-white/10 hover:text-white transition cursor-pointer"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-slate-400">
              We're working on amazing content. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {posts.map((post) => {
              const style = post.style_guide;
              const hasStyle = style?.colors;
              
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group"
                >
                  <article 
                    className="relative h-full rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-white/10 hover:border-white/20"
                    style={{
                      background: hasStyle 
                        ? `linear-gradient(135deg, ${style.colors.background}10, ${style.colors.primary}08)`
                        : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    {/* Style Color Bar */}
                    {hasStyle && <ColorBar colors={style.colors} />}
                    
                    {/* Featured Image */}
                    {post.featured_image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    
                    <div className="p-6 flex flex-col h-full">
                      {/* Category & Theme */}
                      <div className="flex items-center justify-between mb-3">
                        {post.category && (
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: hasStyle 
                                ? `${style.colors.primary}20` 
                                : 'rgba(16, 185, 129, 0.15)',
                              color: hasStyle ? style.colors.primary : '#10B981',
                            }}
                          >
                            {post.category}
                          </span>
                        )}
                        {style?.themeName && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            🎨 {style.themeName}
                          </span>
                        )}
                      </div>
                      
                      {/* Title */}
                      <h2 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                        {post.title}
                      </h2>
                      
                      {/* Excerpt */}
                      <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">
                        {post.excerpt || generateExcerpt(post.content)}
                      </p>
                      
                      {/* Mood */}
                      {style?.mood && (
                        <p className="text-xs text-slate-500 italic mb-4 line-clamp-1">
                          "{style.mood}"
                        </p>
                      )}
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                        <time className="text-xs text-slate-500">
                          {formatDate(post.published_at || post.created_at)}
                        </time>
                        
                        <span 
                          className="text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                          style={{ color: hasStyle ? style.colors.primary : '#10B981' }}
                        >
                          Read →
                        </span>
                      </div>
                    </div>
                    
                    {/* Hover glow effect */}
                    {hasStyle && (
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at center, ${style.colors.primary}10, transparent 70%)`,
                        }}
                      />
                    )}
                  </article>
                </Link>
              );
            })}
          </div>
        )}
        
        {/* Newsletter CTA */}
        <div className="mt-20 p-10 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Transform Your Marketing?
            </h3>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join thousands of local businesses using AI-powered automation to dominate their market.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-emerald-500/25"
            >
              Get Started Free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-slate-500 text-sm">
            © {new Date().getFullYear()} GreenLine365. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link href="/" className="text-slate-500 hover:text-emerald-400 text-sm transition">Home</Link>
            <Link href="/admin-v2" className="text-slate-500 hover:text-emerald-400 text-sm transition">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
