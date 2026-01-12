import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface StyleGuide {
  themeName?: string;
  description?: string;
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    background: string;
    text: string;
    headings?: string;
    links?: string;
    textMuted?: string;
  };
  texture?: {
    type: string;
    opacity: number;
  };
  typography?: {
    headingStyle?: string;
    headingSize?: string;
    bodyLineHeight?: string;
  };
  layout?: {
    contentWidth?: string;
    spacing?: string;
    headerStyle?: string;
  };
  mood?: string;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (!post) return { title: 'Post Not Found' };
  
  return {
    title: `${post.title} | GreenLine365 Blog`,
    description: post.meta_description || post.excerpt || generateExcerpt(post.content),
    keywords: post.meta_keywords,
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image ? [post.featured_image] : [],
      type: 'article',
    },
  };
}

function generateExcerpt(content: string, maxLength: number = 160): string {
  const cleaned = content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + '...';
}

// Markdown to HTML converter with style support
function renderMarkdown(content: string, style?: StyleGuide): string {
  let html = content;
  
  // Headers with style colors
  const headingColor = style?.colors?.headings || style?.colors?.primary || '#1a1a1a';
  html = html.replace(/^### (.+)$/gm, `<h3 style="color: ${headingColor}; font-size: 1.25rem; font-weight: 700; margin: 2rem 0 0.75rem 0;">$1</h3>`);
  html = html.replace(/^## (.+)$/gm, `<h2 style="color: ${headingColor}; font-size: 1.5rem; font-weight: 700; margin: 2.5rem 0 1rem 0;">$1</h2>`);
  html = html.replace(/^# (.+)$/gm, `<h1 style="color: ${headingColor}; font-size: 2rem; font-weight: 800; margin: 2rem 0 1rem 0;">$1</h1>`);
  
  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links with style color
  const linkColor = style?.colors?.links || style?.colors?.primary || '#0066cc';
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color: ${linkColor}; text-decoration: underline;">$1</a>`);
  
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.5rem;">$1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left: 1.5rem; margin-bottom: 0.5rem;"><span style="font-weight: 600;">$1.</span> $2</li>');
  
  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (p.startsWith('<h') || p.startsWith('<li') || p.trim() === '') return p;
    return `<p style="margin-bottom: 1.25rem; line-height: 1.75;">${p.replace(/\n/g, '<br/>')}</p>`;
  }).join('');
  
  return html;
}

// Get texture pattern CSS
function getTextureStyle(texture?: { type: string; opacity: number }): string {
  if (!texture || texture.type === 'none') return '';
  
  const patterns: Record<string, string> = {
    grain: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    dots: `radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)`,
    lines: `repeating-linear-gradient(0deg, transparent, transparent 9px, rgba(0,0,0,0.03) 9px, rgba(0,0,0,0.03) 10px)`,
  };
  
  return patterns[texture.type] || '';
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Fetch post - allow both published and draft for preview
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (!post) {
    notFound();
  }
  
  const style: StyleGuide | undefined = post.style_guide;
  const readTime = Math.ceil((post.content?.split(/\s+/).length || 0) / 200);
  
  // Get related posts
  const { data: relatedPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, style_guide')
    .eq('status', 'published')
    .eq('category', post.category)
    .neq('id', post.id)
    .limit(3);
  
  // Determine content width
  const contentWidth = style?.layout?.contentWidth === 'narrow' ? '680px' 
    : style?.layout?.contentWidth === 'wide' ? '1000px' 
    : '800px';
  
  // Get spacing
  const spacing = style?.layout?.spacing === 'airy' ? '3rem' 
    : style?.layout?.spacing === 'compact' ? '1.5rem' 
    : '2rem';
  
  // Texture
  const texturePattern = getTextureStyle(style?.texture);
  
  return (
    <main 
      className="min-h-screen relative"
      style={{ 
        backgroundColor: style?.colors?.background || '#ffffff',
        color: style?.colors?.text || '#1a1a1a',
      }}
    >
      {/* Texture Overlay */}
      {texturePattern && (
        <div 
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: texturePattern,
            backgroundSize: style?.texture?.type === 'dots' ? '20px 20px' : 'auto',
            opacity: style?.texture?.opacity || 0.3,
          }}
        />
      )}
      
      {/* Hero Header - Optional gradient header style */}
      {style?.layout?.headerStyle === 'gradient' && (
        <div 
          className="h-2"
          style={{
            background: `linear-gradient(to right, ${style.colors.primary}, ${style.colors.secondary || style.colors.accent || style.colors.primary})`,
          }}
        />
      )}
      
      <article className="relative z-10 pt-8 pb-20 px-4 sm:px-6">
        <div className="mx-auto" style={{ maxWidth: contentWidth }}>
          {/* Back to Blog */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:opacity-70"
            style={{ color: style?.colors?.textMuted || style?.colors?.text || '#666' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
          
          {/* Theme Badge */}
          {style?.themeName && (
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ 
                backgroundColor: `${style.colors.primary}15`,
                color: style.colors.primary,
              }}
            >
              <span>🎨</span> {style.themeName}
            </div>
          )}
          
          {/* Category */}
          {post.category && (
            <div 
              className="text-sm font-semibold mb-4 uppercase tracking-wide"
              style={{ color: style?.colors?.primary || '#10B981' }}
            >
              {post.category}
            </div>
          )}
          
          {/* Title */}
          <h1 
            className="font-bold mb-6"
            style={{ 
              fontSize: style?.typography?.headingSize === 'large' ? 'clamp(2.25rem, 5vw, 3.5rem)' 
                : style?.typography?.headingSize === 'small' ? 'clamp(1.75rem, 3vw, 2.25rem)'
                : 'clamp(2rem, 4vw, 3rem)',
              lineHeight: '1.2',
              color: style?.colors?.headings || style?.colors?.primary || '#1a1a1a',
              fontWeight: style?.typography?.headingStyle === 'light' ? '500' : '700',
            }}
          >
            {post.title}
          </h1>
          
          {/* Meta */}
          <div 
            className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm mb-8 pb-8"
            style={{ 
              borderBottomWidth: '1px',
              borderBottomStyle: 'solid',
              borderBottomColor: `${style?.colors?.text || '#000'}15`,
              color: style?.colors?.textMuted || '#666',
            }}
          >
            <span>
              {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span>⏱ {readTime} min read</span>
            {style?.mood && (
              <span className="italic">"{style.mood}"</span>
            )}
          </div>
          
          {/* Featured Image */}
          {post.featured_image && (
            <div 
              className="mb-12 overflow-hidden"
              style={{ 
                borderRadius: style?.layout?.headerStyle === 'minimal' ? '0.5rem' : '1rem',
              }}
            >
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          
          {/* Content */}
          <div 
            className="blog-content"
            style={{
              fontSize: '1.125rem',
              lineHeight: style?.typography?.bodyLineHeight === 'tight' ? '1.5' 
                : style?.typography?.bodyLineHeight === 'relaxed' ? '1.9' 
                : '1.75',
              marginBottom: spacing,
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content, style) }}
          />
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div 
              className="flex flex-wrap gap-2 mt-12 pt-8"
              style={{ 
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
                borderTopColor: `${style?.colors?.text || '#000'}10`,
              }}
            >
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `${style?.colors?.primary || '#10B981'}10`,
                    color: style?.colors?.textMuted || '#666',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {/* CTA */}
          <div 
            className="mt-16 p-8 rounded-2xl text-center"
            style={{
              backgroundColor: `${style?.colors?.primary || '#10B981'}10`,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: `${style?.colors?.primary || '#10B981'}20`,
            }}
          >
            <h3 
              className="text-xl font-bold mb-3"
              style={{ color: style?.colors?.headings || style?.colors?.primary || '#1a1a1a' }}
            >
              Want more insights like this?
            </h3>
            <p 
              className="mb-6"
              style={{ color: style?.colors?.textMuted || '#666' }}
            >
              Subscribe to GreenLine365 and get AI-powered marketing automation for your business.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: style?.colors?.primary || '#10B981' }}
            >
              Get Started Free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </article>
      
      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section 
          className="py-16 px-4 sm:px-6"
          style={{ 
            backgroundColor: `${style?.colors?.text || '#000'}05`,
          }}
        >
          <div className="max-w-[1000px] mx-auto">
            <h2 
              className="text-2xl font-bold mb-8"
              style={{ color: style?.colors?.headings || style?.colors?.text || '#1a1a1a' }}
            >
              Related Posts
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => {
                const relatedStyle = related.style_guide as StyleGuide | undefined;
                return (
                  <Link
                    key={related.id}
                    href={`/blog/${related.slug}`}
                    className="p-6 rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
                    style={{
                      backgroundColor: style?.colors?.background || '#fff',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: `${style?.colors?.text || '#000'}10`,
                    }}
                  >
                    {relatedStyle?.colors && (
                      <div className="flex gap-1 mb-3">
                        {Object.values(relatedStyle.colors).slice(0, 4).map((color, i) => (
                          <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color as string }} />
                        ))}
                      </div>
                    )}
                    <h3 
                      className="font-bold text-lg mb-2 line-clamp-2"
                      style={{ color: style?.colors?.headings || '#1a1a1a' }}
                    >
                      {related.title}
                    </h3>
                    <p 
                      className="text-sm line-clamp-2"
                      style={{ color: style?.colors?.textMuted || '#666' }}
                    >
                      {related.excerpt || generateExcerpt(related.content)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
      
      {/* Footer */}
      <footer 
        className="py-8 text-center text-sm"
        style={{ 
          borderTopWidth: '1px',
          borderTopStyle: 'solid',
          borderTopColor: `${style?.colors?.text || '#000'}10`,
          color: style?.colors?.textMuted || '#666',
        }}
      >
        © {new Date().getFullYear()} GreenLine365. All rights reserved.
      </footer>
    </main>
  );
}
