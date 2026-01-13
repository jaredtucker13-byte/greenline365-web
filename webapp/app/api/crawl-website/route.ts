import { NextRequest, NextResponse } from 'next/server';

/**
 * Website Reverse Engineering API
 * 
 * Extracts everything from a website:
 * - Content (headlines, text, CTAs)
 * - Color palette
 * - Structure (sections, navigation)
 * - Images/Assets
 * - Metadata (SEO, title, description)
 * 
 * This allows users to redesign the layout/aesthetics while keeping content intact.
 */

interface ExtractedContent {
  url: string;
  title: string;
  description: string;
  favicon?: string;
  colors: {
    primary: string[];
    background: string[];
    text: string[];
    accent: string[];
    all: string[];
  };
  content: {
    headlines: string[];
    paragraphs: string[];
    ctas: string[];
    navigation: string[];
    footerLinks: string[];
  };
  images: {
    logo?: string;
    hero?: string;
    all: { src: string; alt: string }[];
  };
  structure: {
    hasNavbar: boolean;
    hasHero: boolean;
    hasFeatures: boolean;
    hasTestimonials: boolean;
    hasPricing: boolean;
    hasFooter: boolean;
    sectionCount: number;
    sections: string[];
  };
  metadata: {
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    keywords?: string;
    author?: string;
  };
  rawHtml?: string;
  rawCss?: string;
}

// Helper to extract colors from CSS
function extractColorsFromCss(css: string): string[] {
  const colors: Set<string> = new Set();
  
  // Hex colors
  const hexRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
  let match;
  while ((match = hexRegex.exec(css)) !== null) {
    colors.add(match[0].toLowerCase());
  }
  
  // RGB/RGBA colors
  const rgbRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi;
  while ((match = rgbRegex.exec(css)) !== null) {
    colors.add(match[0].toLowerCase());
  }
  
  // HSL colors
  const hslRegex = /hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+\s*)?\)/gi;
  while ((match = hslRegex.exec(css)) !== null) {
    colors.add(match[0].toLowerCase());
  }
  
  return Array.from(colors);
}

// Helper to categorize colors
function categorizeColors(colors: string[]): ExtractedContent['colors'] {
  const result = {
    primary: [] as string[],
    background: [] as string[],
    text: [] as string[],
    accent: [] as string[],
    all: colors,
  };
  
  colors.forEach(color => {
    const hex = color.startsWith('#') ? color : '';
    if (!hex) return;
    
    // Simple heuristic based on brightness
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    if (brightness > 240) {
      result.background.push(color);
    } else if (brightness < 50) {
      result.text.push(color);
    } else if (r > 200 || g > 200 || b > 200) {
      result.accent.push(color);
    } else {
      result.primary.push(color);
    }
  });
  
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log('[Crawl Website] Fetching:', normalizedUrl);

    // Fetch the webpage
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GreenLine365Bot/1.0; +https://greenline365.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch website: ${response.status} ${response.statusText}` 
      }, { status: 500 });
    }

    const html = await response.text();
    
    // Parse the HTML
    const extracted: ExtractedContent = {
      url: normalizedUrl,
      title: '',
      description: '',
      colors: { primary: [], background: [], text: [], accent: [], all: [] },
      content: { headlines: [], paragraphs: [], ctas: [], navigation: [], footerLinks: [] },
      images: { all: [] },
      structure: {
        hasNavbar: false,
        hasHero: false,
        hasFeatures: false,
        hasTestimonials: false,
        hasPricing: false,
        hasFooter: false,
        sectionCount: 0,
        sections: [],
      },
      metadata: {},
    };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) extracted.title = titleMatch[1].trim();

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) extracted.description = descMatch[1].trim();

    // Extract favicon
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
    if (faviconMatch) {
      extracted.favicon = faviconMatch[1].startsWith('http') 
        ? faviconMatch[1] 
        : new URL(faviconMatch[1], normalizedUrl).href;
    }

    // Extract OG metadata
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogImageMatch) extracted.metadata.ogImage = ogImageMatch[1];

    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) extracted.metadata.ogTitle = ogTitleMatch[1];

    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDescMatch) extracted.metadata.ogDescription = ogDescMatch[1];

    // Extract all headlines (h1-h6)
    const headlineRegex = /<h[1-6][^>]*>([^<]+(?:<[^>]+>[^<]+)*)<\/h[1-6]>/gi;
    let headlineMatch;
    while ((headlineMatch = headlineRegex.exec(html)) !== null) {
      const text = headlineMatch[1].replace(/<[^>]+>/g, '').trim();
      if (text && text.length > 2) {
        extracted.content.headlines.push(text);
      }
    }

    // Extract paragraphs
    const paraRegex = /<p[^>]*>([^<]+(?:<[^>]+>[^<]+)*)<\/p>/gi;
    let paraMatch;
    while ((paraMatch = paraRegex.exec(html)) !== null) {
      const text = paraMatch[1].replace(/<[^>]+>/g, '').trim();
      if (text && text.length > 20) {
        extracted.content.paragraphs.push(text);
      }
    }

    // Extract CTAs (buttons, links with action words)
    const ctaRegex = /<(?:button|a)[^>]*>([^<]*(?:get started|sign up|try|start|buy|subscribe|contact|learn more|view|explore|discover|join)[^<]*)<\/(?:button|a)>/gi;
    let ctaMatch;
    while ((ctaMatch = ctaRegex.exec(html)) !== null) {
      const text = ctaMatch[1].replace(/<[^>]+>/g, '').trim();
      if (text) {
        extracted.content.ctas.push(text);
      }
    }

    // Also extract buttons
    const buttonRegex = /<button[^>]*>([^<]+)<\/button>/gi;
    while ((ctaMatch = buttonRegex.exec(html)) !== null) {
      const text = ctaMatch[1].trim();
      if (text && text.length > 1 && text.length < 50) {
        extracted.content.ctas.push(text);
      }
    }

    // Extract navigation links
    const navRegex = /<nav[^>]*>([\s\S]*?)<\/nav>/gi;
    let navMatch;
    while ((navMatch = navRegex.exec(html)) !== null) {
      const navHtml = navMatch[1];
      const linkRegex = /<a[^>]*>([^<]+)<\/a>/gi;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(navHtml)) !== null) {
        const text = linkMatch[1].trim();
        if (text && text.length > 1) {
          extracted.content.navigation.push(text);
        }
      }
      extracted.structure.hasNavbar = true;
    }

    // Extract footer content
    const footerRegex = /<footer[^>]*>([\s\S]*?)<\/footer>/gi;
    let footerMatch;
    while ((footerMatch = footerRegex.exec(html)) !== null) {
      const footerHtml = footerMatch[1];
      const linkRegex = /<a[^>]*>([^<]+)<\/a>/gi;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(footerHtml)) !== null) {
        const text = linkMatch[1].trim();
        if (text && text.length > 1) {
          extracted.content.footerLinks.push(text);
        }
      }
      extracted.structure.hasFooter = true;
    }

    // Extract images
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      let src = imgMatch[1];
      if (!src.startsWith('http') && !src.startsWith('data:')) {
        src = new URL(src, normalizedUrl).href;
      }
      extracted.images.all.push({
        src,
        alt: imgMatch[2] || '',
      });
    }

    // Try to identify hero image (first large image or one with hero-related class)
    const heroImgMatch = html.match(/<img[^>]*(?:class=["'][^"']*hero[^"']*["']|id=["'][^"']*hero[^"']*["'])[^>]*src=["']([^"']+)["']/i);
    if (heroImgMatch) {
      extracted.images.hero = heroImgMatch[1].startsWith('http') 
        ? heroImgMatch[1] 
        : new URL(heroImgMatch[1], normalizedUrl).href;
    }

    // Try to identify logo
    const logoMatch = html.match(/<img[^>]*(?:class=["'][^"']*logo[^"']*["']|alt=["'][^"']*logo[^"']*["'])[^>]*src=["']([^"']+)["']/i);
    if (logoMatch) {
      extracted.images.logo = logoMatch[1].startsWith('http') 
        ? logoMatch[1] 
        : new URL(logoMatch[1], normalizedUrl).href;
    }

    // Extract inline styles and style tags for colors
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let cssContent = '';
    let styleMatch;
    while ((styleMatch = styleRegex.exec(html)) !== null) {
      cssContent += styleMatch[1] + '\n';
    }

    // Extract inline styles
    const inlineStyleRegex = /style=["']([^"']+)["']/gi;
    let inlineMatch;
    while ((inlineMatch = inlineStyleRegex.exec(html)) !== null) {
      cssContent += inlineMatch[1] + '\n';
    }

    // Extract colors from CSS
    const allColors = extractColorsFromCss(cssContent + html);
    extracted.colors = categorizeColors(allColors);

    // Detect structure/sections
    const sectionKeywords = {
      hero: /hero|banner|jumbotron|splash/i,
      features: /feature|benefit|service|what-we/i,
      testimonials: /testimonial|review|feedback|customer/i,
      pricing: /pricing|price|plan|subscription/i,
    };

    // Count sections
    const sectionMatches = html.match(/<section[^>]*>/gi);
    extracted.structure.sectionCount = sectionMatches ? sectionMatches.length : 0;

    // Check for specific sections
    extracted.structure.hasHero = sectionKeywords.hero.test(html);
    extracted.structure.hasFeatures = sectionKeywords.features.test(html);
    extracted.structure.hasTestimonials = sectionKeywords.testimonials.test(html);
    extracted.structure.hasPricing = sectionKeywords.pricing.test(html);

    // Build section list
    if (extracted.structure.hasNavbar) extracted.structure.sections.push('Navigation');
    if (extracted.structure.hasHero) extracted.structure.sections.push('Hero');
    if (extracted.structure.hasFeatures) extracted.structure.sections.push('Features');
    if (extracted.structure.hasTestimonials) extracted.structure.sections.push('Testimonials');
    if (extracted.structure.hasPricing) extracted.structure.sections.push('Pricing');
    if (extracted.structure.hasFooter) extracted.structure.sections.push('Footer');

    // Remove duplicates from arrays
    extracted.content.headlines = [...new Set(extracted.content.headlines)];
    extracted.content.paragraphs = [...new Set(extracted.content.paragraphs)].slice(0, 20);
    extracted.content.ctas = [...new Set(extracted.content.ctas)];
    extracted.content.navigation = [...new Set(extracted.content.navigation)];
    extracted.content.footerLinks = [...new Set(extracted.content.footerLinks)];
    extracted.colors.all = [...new Set(extracted.colors.all)].slice(0, 30);

    console.log('[Crawl Website] Successfully extracted data from:', normalizedUrl);

    return NextResponse.json({
      success: true,
      data: extracted,
    });

  } catch (error: any) {
    console.error('[Crawl Website] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to crawl website' },
      { status: 500 }
    );
  }
}
