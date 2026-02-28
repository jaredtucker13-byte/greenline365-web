import * as cheerio from 'cheerio';

// TODO: For JS-rendered sites, route through /api/deep-crawl on VPS using Playwright

export interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  wordCount: number;
  links: {
    internal: number;
    external: number;
  };
  images: {
    total: number;
    missingAlt: { src: string }[];
  };
  canonical: string | null;
  robotsMeta: string | null;
  openGraph: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    url: string | null;
  };
  seoScore: number;
  opportunities: string[];
}

function calculateSeoScore(result: Omit<CrawlResult, 'seoScore' | 'opportunities'>): number {
  let score = 0;
  const max = 100;

  // Title present and reasonable length (0-15 pts)
  if (result.title) {
    score += 10;
    if (result.title.length >= 30 && result.title.length <= 65) score += 5;
  }

  // Meta description present and reasonable length (0-15 pts)
  if (result.metaDescription) {
    score += 10;
    if (result.metaDescription.length >= 120 && result.metaDescription.length <= 160) score += 5;
  }

  // H1 present and singular (0-10 pts)
  if (result.headings.h1.length === 1) score += 10;
  else if (result.headings.h1.length > 1) score += 5;

  // H2/H3 structure (0-10 pts)
  if (result.headings.h2.length > 0) score += 5;
  if (result.headings.h3.length > 0) score += 5;

  // Word count (0-10 pts)
  if (result.wordCount >= 300) score += 5;
  if (result.wordCount >= 800) score += 5;

  // Image alt text (0-10 pts)
  if (result.images.total > 0) {
    const altRatio = 1 - result.images.missingAlt.length / result.images.total;
    score += Math.round(altRatio * 10);
  } else {
    score += 5;
  }

  // Canonical tag (0-5 pts)
  if (result.canonical) score += 5;

  // Open Graph tags (0-10 pts)
  if (result.openGraph.title) score += 3;
  if (result.openGraph.description) score += 3;
  if (result.openGraph.image) score += 4;

  // Meta keywords (0-5 pts)
  if (result.metaKeywords) score += 5;

  // Internal links (0-5 pts)
  if (result.links.internal >= 3) score += 5;
  else if (result.links.internal >= 1) score += 3;

  // Robots meta (0-5 pts)
  if (!result.robotsMeta || !result.robotsMeta.includes('noindex')) score += 5;

  return Math.min(score, max);
}

function identifyOpportunities(result: Omit<CrawlResult, 'seoScore' | 'opportunities'>): string[] {
  const gaps: string[] = [];

  if (!result.title) gaps.push('Missing page title');
  else if (result.title.length < 30) gaps.push('Page title too short (< 30 chars)');
  else if (result.title.length > 65) gaps.push('Page title too long (> 65 chars)');

  if (!result.metaDescription) gaps.push('Missing meta description');
  else if (result.metaDescription.length < 120) gaps.push('Meta description too short (< 120 chars)');
  else if (result.metaDescription.length > 160) gaps.push('Meta description too long (> 160 chars)');

  if (result.headings.h1.length === 0) gaps.push('Missing H1 tag');
  if (result.headings.h1.length > 1) gaps.push('Multiple H1 tags found (use only one)');

  if (result.wordCount < 300) gaps.push('Thin content — under 300 words');

  if (result.images.missingAlt.length > 0) {
    gaps.push(`${result.images.missingAlt.length} image(s) missing alt text`);
  }

  if (!result.canonical) gaps.push('Missing canonical tag');

  if (!result.openGraph.title) gaps.push('Missing Open Graph title');
  if (!result.openGraph.image) gaps.push('Missing Open Graph image');

  // Greenline-specific opportunity gaps
  const bodyText = (result.title + ' ' + result.metaDescription).toLowerCase();
  if (!bodyText.includes('book') && !bodyText.includes('schedule') && !bodyText.includes('appointment')) {
    gaps.push('No booking / scheduling system detected — Greenline opportunity');
  }
  if (!bodyText.includes('review') && !bodyText.includes('testimonial') && !bodyText.includes('trust')) {
    gaps.push('Missing trust signals (reviews, testimonials) — Greenline opportunity');
  }

  return gaps;
}

export async function crawlSite(url: string): Promise<CrawlResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'GreenlinePulse/1.0 (+https://greenline365.com/bot)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const parsedUrl = new URL(url);

  // Extract title
  const title = $('title').first().text().trim();

  // Meta tags
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const metaKeywords = $('meta[name="keywords"]').attr('content')?.trim() || '';

  // Headings
  const h1: string[] = [];
  const h2: string[] = [];
  const h3: string[] = [];
  $('h1').each((_, el) => { h1.push($(el).text().trim()); });
  $('h2').each((_, el) => { h2.push($(el).text().trim()); });
  $('h3').each((_, el) => { h3.push($(el).text().trim()); });

  // Word count (visible body text)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Links
  let internal = 0;
  let external = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === parsedUrl.hostname) internal++;
      else external++;
    } catch {
      // Relative or malformed — treat as internal
      if (href.startsWith('/') || href.startsWith('#') || href.startsWith('.')) internal++;
    }
  });

  // Images
  const missingAlt: { src: string }[] = [];
  let totalImages = 0;
  $('img').each((_, el) => {
    totalImages++;
    const alt = $(el).attr('alt');
    if (!alt || alt.trim() === '') {
      missingAlt.push({ src: $(el).attr('src') || 'unknown' });
    }
  });

  // Canonical
  const canonical = $('link[rel="canonical"]').attr('href') || null;

  // Robots meta
  const robotsMeta = $('meta[name="robots"]').attr('content') || null;

  // Open Graph
  const openGraph = {
    title: $('meta[property="og:title"]').attr('content') || null,
    description: $('meta[property="og:description"]').attr('content') || null,
    image: $('meta[property="og:image"]').attr('content') || null,
    type: $('meta[property="og:type"]').attr('content') || null,
    url: $('meta[property="og:url"]').attr('content') || null,
  };

  const partial = {
    url,
    title,
    metaDescription,
    metaKeywords,
    headings: { h1, h2, h3 },
    wordCount,
    links: { internal, external },
    images: { total: totalImages, missingAlt },
    canonical,
    robotsMeta,
    openGraph,
  };

  const opportunities = identifyOpportunities(partial);
  const seoScore = calculateSeoScore(partial);

  return { ...partial, seoScore, opportunities };
}
