import { NextRequest, NextResponse } from 'next/server';

// ── Stop-words list for keyword extraction ──────────────────────────
const STOP_WORDS = new Set([
  'the','and','for','are','but','not','you','all','any','can','had','her',
  'was','one','our','out','has','his','how','its','let','may','new','now',
  'old','see','way','who','did','get','got','him','hit','own','say','she',
  'too','use','been','call','come','each','find','from','have','here',
  'just','know','like','long','look','make','many','more','most','much',
  'must','name','only','over','part','some','such','take','than','that',
  'them','then','they','this','time','very','what','when','will','with',
  'work','year','your','also','back','been','even','give','good','into',
  'keep','last','made','need','next','only','same','tell','that','them',
  'then','they','this','used','well','were','which','about','after','being',
  'could','every','first','great','their','there','these','thing','think',
  'those','three','through','would','other','should','still','where','while',
  'might','right','people','before','really','because','between','through',
  'during','without','however','another','business','content',
]);

// ── Helpers ─────────────────────────────────────────────────────────

function stripMarkdown(md: string): string {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')          // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')    // links → text
    .replace(/#{1,6}\s*/g, '')                 // headings
    .replace(/[*_~`>]/g, '')                   // emphasis / blockquote / code
    .replace(/\|.*?\|/g, ' ')                  // table cells
    .replace(/-{3,}/g, '')                     // hr
    .replace(/\n+/g, ' ')
    .trim();
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  let count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
               .replace(/^y/, '')
               .match(/[aeiouy]{1,2}/g);
  return count ? count.length : 1;
}

function fleschKincaid(words: number, sentences: number, syllables: number) {
  if (sentences === 0 || words === 0) return 0;
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

function extractLinks(content: string): { internal: string[]; external: string[] } {
  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
  const internal: string[] = [];
  const external: string[] = [];
  let m;
  while ((m = linkRegex.exec(content)) !== null) {
    const url = m[2];
    if (url.startsWith('/') || url.startsWith('#') || url.includes('greenline365')) {
      internal.push(url);
    } else if (url.startsWith('http')) {
      external.push(url);
    }
  }
  return { internal, external };
}

function extractImages(content: string): { src: string; alt: string }[] {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const imgs: { src: string; alt: string }[] = [];
  let m;
  while ((m = imgRegex.exec(content)) !== null) {
    imgs.push({ alt: m[1], src: m[2] });
  }
  return imgs;
}

function extractHeadings(content: string): { level: number; text: string }[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: { level: number; text: string }[] = [];
  let m;
  while ((m = headingRegex.exec(content)) !== null) {
    headings.push({ level: m[1].length, text: m[2].trim() });
  }
  return headings;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 75);
}

// ── Category scoring interfaces ─────────────────────────────────────

interface CategoryResult {
  name: string;
  score: number;      // 0-100
  maxScore: number;   // always 100 (per-category)
  weight: number;     // how much it matters for overall score
  status: 'pass' | 'warning' | 'fail';
  items: {
    label: string;
    status: 'pass' | 'warning' | 'fail';
    detail: string;
    fix?: string;
  }[];
}

// ── Individual category analyzers ───────────────────────────────────

function analyzeTitleTag(title: string, topKeywords: string[]): CategoryResult {
  const items: CategoryResult['items'] = [];
  let score = 0;

  // Length check
  const len = title.length;
  if (len >= 50 && len <= 60) {
    score += 35;
    items.push({ label: 'Title length', status: 'pass', detail: `${len} characters (ideal: 50-60)` });
  } else if (len >= 40 && len <= 70) {
    score += 20;
    items.push({ label: 'Title length', status: 'warning', detail: `${len} characters`, fix: `Adjust to 50-60 characters for optimal display in SERPs.` });
  } else {
    score += 5;
    items.push({ label: 'Title length', status: 'fail', detail: `${len} characters`, fix: len < 40 ? 'Title is too short. Expand to 50-60 characters to maximize SERP real estate.' : 'Title is too long and will be truncated in search results. Shorten to 50-60 characters.' });
  }

  // Keyword placement
  const titleLower = title.toLowerCase();
  const primaryKw = topKeywords[0];
  if (primaryKw && titleLower.startsWith(primaryKw)) {
    score += 35;
    items.push({ label: 'Keyword at start', status: 'pass', detail: `Primary keyword "${primaryKw}" appears at the beginning` });
  } else if (primaryKw && titleLower.includes(primaryKw)) {
    score += 20;
    items.push({ label: 'Keyword placement', status: 'warning', detail: `"${primaryKw}" found in title but not at the start`, fix: 'Move your primary keyword closer to the beginning of the title for stronger SEO signal.' });
  } else {
    items.push({ label: 'Keyword in title', status: 'fail', detail: 'Primary keyword not found in title', fix: 'Include your target keyword in the title, ideally near the beginning.' });
  }

  // Power words / emotional triggers
  const powerWords = ['how', 'why', 'best', 'top', 'guide', 'ultimate', 'proven', 'secret', 'easy', 'free', 'new', 'complete', 'essential', 'effective', 'powerful', 'simple', 'step'];
  const hasPowerWord = powerWords.some(pw => titleLower.includes(pw));
  if (hasPowerWord) {
    score += 15;
    items.push({ label: 'Power words', status: 'pass', detail: 'Title contains engaging power words' });
  } else {
    score += 5;
    items.push({ label: 'Power words', status: 'warning', detail: 'No power words detected', fix: `Add a power word like "guide", "proven", "best", or "how to" to improve click-through rate.` });
  }

  // Number in title
  if (/\d/.test(title)) {
    score += 15;
    items.push({ label: 'Number in title', status: 'pass', detail: 'Contains a number which improves CTR' });
  } else {
    score += 5;
    items.push({ label: 'Number in title', status: 'warning', detail: 'No numbers found', fix: 'Titles with numbers (e.g. "7 Ways...", "2026 Guide") get 36% higher CTR on average.' });
  }

  return { name: 'Title Tag', score: Math.min(score, 100), maxScore: 100, weight: 12, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

function analyzeMetaDescription(title: string, content: string, topKeywords: string[]): CategoryResult {
  // We check if the post has an excerpt set — if not, we auto-generate guidance
  const plainContent = stripMarkdown(content);
  const autoExcerpt = plainContent.slice(0, 160);
  const items: CategoryResult['items'] = [];
  let score = 0;

  // Length
  const excerptLen = autoExcerpt.length;
  if (excerptLen >= 120 && excerptLen <= 160) {
    score += 40;
    items.push({ label: 'Meta description length', status: 'pass', detail: `First 160 chars of content serve as meta (~${excerptLen} chars)` });
  } else {
    score += 15;
    items.push({ label: 'Meta description', status: 'warning', detail: 'No explicit meta description set', fix: 'Write a compelling meta description (120-160 characters) that includes your target keyword and a call to action.' });
  }

  // Keyword inclusion
  const primaryKw = topKeywords[0];
  if (primaryKw && autoExcerpt.toLowerCase().includes(primaryKw)) {
    score += 30;
    items.push({ label: 'Keyword in meta', status: 'pass', detail: `"${primaryKw}" appears in opening text` });
  } else {
    score += 5;
    items.push({ label: 'Keyword in meta', status: 'warning', detail: 'Primary keyword missing from opening paragraph', fix: 'Include your target keyword within the first 160 characters of content — search engines use this as the meta description.' });
  }

  // CTA / action words
  const ctaWords = ['learn', 'discover', 'find out', 'get', 'start', 'try', 'read', 'explore', 'check', 'see how', 'click'];
  const hasCta = ctaWords.some(w => autoExcerpt.toLowerCase().includes(w));
  if (hasCta) {
    score += 30;
    items.push({ label: 'Call to action', status: 'pass', detail: 'Opening text contains action-oriented language' });
  } else {
    score += 10;
    items.push({ label: 'Call to action', status: 'warning', detail: 'No call to action detected', fix: 'Add action words like "discover", "learn", or "find out" to encourage clicks from search results.' });
  }

  return { name: 'Meta Description', score: Math.min(score, 100), maxScore: 100, weight: 8, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

function analyzeHeadingStructure(content: string): CategoryResult {
  const headings = extractHeadings(content);
  const items: CategoryResult['items'] = [];
  let score = 0;

  // H1 count — should be exactly 0 in content (title acts as H1)
  const h1s = headings.filter(h => h.level === 1);
  if (h1s.length === 0) {
    score += 25;
    items.push({ label: 'H1 usage', status: 'pass', detail: 'No H1 in body (title serves as H1) — correct' });
  } else {
    score += 10;
    items.push({ label: 'H1 in body', status: 'warning', detail: `${h1s.length} H1 heading(s) found in content`, fix: 'Remove H1 headings from the content body. Your post title already serves as the H1. Use H2/H3 instead.' });
  }

  // H2 presence
  const h2s = headings.filter(h => h.level === 2);
  if (h2s.length >= 2) {
    score += 30;
    items.push({ label: 'H2 sections', status: 'pass', detail: `${h2s.length} H2 headings provide good structure` });
  } else if (h2s.length === 1) {
    score += 15;
    items.push({ label: 'H2 sections', status: 'warning', detail: 'Only 1 H2 heading found', fix: 'Add more H2 headings to break content into scannable sections. Aim for 1 H2 per 200-300 words.' });
  } else {
    items.push({ label: 'H2 sections', status: 'fail', detail: 'No H2 headings found', fix: 'Add H2 headings to structure your content. This helps both readers and search engines understand your content hierarchy.' });
  }

  // H3 usage
  const h3s = headings.filter(h => h.level === 3);
  if (h3s.length > 0) {
    score += 20;
    items.push({ label: 'H3 sub-sections', status: 'pass', detail: `${h3s.length} H3 sub-headings add depth` });
  } else if (h2s.length >= 2) {
    score += 10;
    items.push({ label: 'H3 sub-sections', status: 'warning', detail: 'No H3 headings found', fix: 'Consider adding H3 sub-headings under your H2 sections for better content depth and featured snippet potential.' });
  }

  // Proper nesting (no H3 before H2, no H4 before H3, etc.)
  let properlyNested = true;
  let maxLevel = 0;
  for (const h of headings) {
    if (h.level > maxLevel + 2) {
      properlyNested = false;
      break;
    }
    maxLevel = Math.max(maxLevel, h.level);
  }
  if (properlyNested && headings.length > 0) {
    score += 25;
    items.push({ label: 'Heading hierarchy', status: 'pass', detail: 'Headings follow a logical hierarchy' });
  } else if (headings.length > 0) {
    score += 10;
    items.push({ label: 'Heading hierarchy', status: 'warning', detail: 'Heading levels skip (e.g., H2 → H4)', fix: 'Maintain a sequential heading hierarchy: H2 → H3 → H4. Do not skip levels.' });
  }

  if (headings.length === 0) {
    items.push({ label: 'No headings', status: 'fail', detail: 'Content has no headings at all', fix: 'Add H2 and H3 headings to organize your content. Structured content ranks significantly better.' });
  }

  return { name: 'Heading Structure', score: Math.min(score, 100), maxScore: 100, weight: 10, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

function analyzeKeywords(content: string, title: string): CategoryResult & { topKeywords: string[] } {
  const items: CategoryResult['items'] = [];
  let score = 0;

  const plainContent = stripMarkdown(content).toLowerCase();
  const words = plainContent.match(/\b[a-z]{4,}\b/g) || [];
  const totalWords = words.length;

  // Build frequency map
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!STOP_WORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  const topKeywords = Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  const primaryKw = topKeywords[0];
  if (!primaryKw) {
    return { name: 'Keyword Optimization', score: 0, maxScore: 100, weight: 12, status: 'fail', items: [{ label: 'Keywords', status: 'fail', detail: 'Not enough content to extract keywords', fix: 'Add more content so keywords can be identified.' }], topKeywords: [] };
  }

  // Keyword density
  const primaryCount = freq[primaryKw] || 0;
  const density = totalWords > 0 ? (primaryCount / totalWords) * 100 : 0;
  if (density >= 0.5 && density <= 2.5) {
    score += 30;
    items.push({ label: 'Keyword density', status: 'pass', detail: `"${primaryKw}" appears ${primaryCount} times (${density.toFixed(1)}%)` });
  } else if (density > 2.5) {
    score += 10;
    items.push({ label: 'Keyword density', status: 'warning', detail: `"${primaryKw}" density is ${density.toFixed(1)}%`, fix: 'Keyword density is too high (over 2.5%). Reduce repetition to avoid keyword stuffing penalties.' });
  } else {
    score += 15;
    items.push({ label: 'Keyword density', status: 'warning', detail: `"${primaryKw}" density is ${density.toFixed(1)}%`, fix: 'Keyword density is low. Use your primary keyword more naturally throughout the content (aim for 0.5-2.5%).' });
  }

  // Keyword in first 100 words
  const first100 = words.slice(0, 100).join(' ');
  if (primaryKw && first100.includes(primaryKw)) {
    score += 25;
    items.push({ label: 'Keyword in intro', status: 'pass', detail: `"${primaryKw}" appears in the first 100 words` });
  } else {
    score += 5;
    items.push({ label: 'Keyword in intro', status: 'warning', detail: 'Primary keyword not in the first 100 words', fix: 'Include your primary keyword within the first 100 words to signal relevance to search engines.' });
  }

  // Keyword in title
  if (primaryKw && title.toLowerCase().includes(primaryKw)) {
    score += 25;
    items.push({ label: 'Keyword in title', status: 'pass', detail: `"${primaryKw}" is in the title` });
  } else {
    score += 5;
    items.push({ label: 'Keyword in title', status: 'fail', detail: 'Primary keyword missing from title', fix: `Add "${primaryKw}" to your title for better ranking potential.` });
  }

  // Related keywords / LSI
  const relatedCount = topKeywords.slice(1, 6).length;
  if (relatedCount >= 4) {
    score += 20;
    items.push({ label: 'Related keywords', status: 'pass', detail: `${relatedCount} related terms found — good semantic depth` });
  } else if (relatedCount >= 2) {
    score += 10;
    items.push({ label: 'Related keywords', status: 'warning', detail: `Only ${relatedCount} related terms`, fix: 'Expand your content with related terms and synonyms to improve topical relevance.' });
  } else {
    items.push({ label: 'Related keywords', status: 'fail', detail: 'Very few related terms', fix: 'Your content lacks semantic variety. Add related terms and synonyms to strengthen topical authority.' });
  }

  return { name: 'Keyword Optimization', score: Math.min(score, 100), maxScore: 100, weight: 12, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items, topKeywords };
}

function analyzeLinking(content: string): CategoryResult {
  const { internal, external } = extractLinks(content);
  const items: CategoryResult['items'] = [];
  let score = 0;

  // Internal links
  if (internal.length >= 2) {
    score += 40;
    items.push({ label: 'Internal links', status: 'pass', detail: `${internal.length} internal link(s) found` });
  } else if (internal.length === 1) {
    score += 20;
    items.push({ label: 'Internal links', status: 'warning', detail: '1 internal link found', fix: 'Add 2-3 more internal links to related blog posts or pages. This improves site navigation and distributes page authority.' });
  } else {
    items.push({ label: 'Internal links', status: 'fail', detail: 'No internal links found', fix: 'Add 2-4 internal links to related content on your site. Internal linking is one of the easiest SEO wins.' });
  }

  // External links
  if (external.length >= 1) {
    score += 35;
    items.push({ label: 'External links', status: 'pass', detail: `${external.length} external link(s) to authoritative sources` });
  } else {
    score += 5;
    items.push({ label: 'External links', status: 'warning', detail: 'No external links found', fix: 'Link to 1-3 authoritative external sources (studies, official docs, reputable sites) to boost credibility and E-E-A-T.' });
  }

  // Anchor text diversity (check for "click here" anti-pattern)
  const clickHereRegex = /\[(click here|here|link|read more)\]/gi;
  const badAnchors = content.match(clickHereRegex) || [];
  if (badAnchors.length === 0 && (internal.length + external.length) > 0) {
    score += 25;
    items.push({ label: 'Anchor text', status: 'pass', detail: 'Link anchor text appears descriptive' });
  } else if (badAnchors.length > 0) {
    score += 10;
    items.push({ label: 'Anchor text', status: 'warning', detail: `${badAnchors.length} generic anchor(s) like "click here"`, fix: 'Replace generic anchors ("click here", "read more") with descriptive text that tells users and search engines what the linked page is about.' });
  }

  return { name: 'Internal & External Links', score: Math.min(score, 100), maxScore: 100, weight: 8, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

function analyzeImages(content: string, uploadedImageCount: number): CategoryResult {
  const images = extractImages(content);
  const totalImages = images.length + uploadedImageCount;
  const items: CategoryResult['items'] = [];
  let score = 0;

  // Has images
  if (totalImages >= 1) {
    score += 30;
    items.push({ label: 'Images present', status: 'pass', detail: `${totalImages} image(s) found` });
  } else {
    items.push({ label: 'Images', status: 'fail', detail: 'No images found', fix: 'Add at least 1-2 relevant images. Posts with images get 94% more views and rank better in image search.' });
  }

  // Alt text analysis
  const missingAlt = images.filter(img => !img.alt || img.alt.trim() === '');
  if (images.length > 0 && missingAlt.length === 0) {
    score += 35;
    items.push({ label: 'Alt text', status: 'pass', detail: 'All markdown images have alt text' });
  } else if (missingAlt.length > 0) {
    score += 10;
    items.push({ label: 'Alt text', status: 'warning', detail: `${missingAlt.length} image(s) missing alt text`, fix: 'Add descriptive alt text to every image. Include your target keyword naturally where relevant. Format: ![descriptive alt text](url)' });
  } else if (uploadedImageCount > 0) {
    score += 20;
    items.push({ label: 'Alt text', status: 'warning', detail: 'Uploaded images — ensure alt text is set when published', fix: 'Make sure each uploaded image has descriptive alt text before publishing.' });
  }

  // Image-to-text ratio
  const wordCount = stripMarkdown(content).split(/\s+/).length;
  const idealRatio = Math.max(1, Math.floor(wordCount / 300));
  if (totalImages >= idealRatio) {
    score += 35;
    items.push({ label: 'Image density', status: 'pass', detail: `Good ratio: ~1 image per ${Math.round(wordCount / Math.max(totalImages, 1))} words` });
  } else {
    score += 15;
    items.push({ label: 'Image density', status: 'warning', detail: `Consider adding more images (aim for ~1 per 300 words)`, fix: `With ${wordCount} words, aim for at least ${idealRatio} image(s) to keep readers engaged.` });
  }

  return { name: 'Image Optimization', score: Math.min(score, 100), maxScore: 100, weight: 8, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

function analyzeReadability(content: string): CategoryResult {
  const plain = stripMarkdown(content);
  const words = plain.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const items: CategoryResult['items'] = [];
  let score = 0;

  // Flesch-Kincaid
  const fk = fleschKincaid(wordCount, sentenceCount, totalSyllables);
  const fkRounded = Math.round(fk);
  if (fk >= 60) {
    score += 35;
    items.push({ label: 'Flesch-Kincaid score', status: 'pass', detail: `${fkRounded} — Easy to read (grade 6-8 level)` });
  } else if (fk >= 40) {
    score += 20;
    items.push({ label: 'Flesch-Kincaid score', status: 'warning', detail: `${fkRounded} — Moderately difficult`, fix: 'Simplify sentence structure and use shorter words. Aim for a Flesch-Kincaid score above 60 for web content.' });
  } else {
    score += 5;
    items.push({ label: 'Flesch-Kincaid score', status: 'fail', detail: `${fkRounded} — Difficult to read`, fix: 'Content is too complex for most readers. Break long sentences, use simpler vocabulary, and aim for a score above 60.' });
  }

  // Average sentence length
  const avgSentLen = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  if (avgSentLen <= 20) {
    score += 25;
    items.push({ label: 'Sentence length', status: 'pass', detail: `Average ${Math.round(avgSentLen)} words/sentence` });
  } else if (avgSentLen <= 25) {
    score += 15;
    items.push({ label: 'Sentence length', status: 'warning', detail: `Average ${Math.round(avgSentLen)} words/sentence`, fix: 'Some sentences are long. Break sentences over 20 words into shorter ones for better readability.' });
  } else {
    score += 5;
    items.push({ label: 'Sentence length', status: 'fail', detail: `Average ${Math.round(avgSentLen)} words/sentence`, fix: 'Sentences are too long. Keep most sentences under 20 words. Vary sentence length for rhythm.' });
  }

  // Paragraph length
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  const longParagraphs = paragraphs.filter(p => stripMarkdown(p).split(/\s+/).length > 150);
  if (longParagraphs.length === 0 && paragraphs.length > 0) {
    score += 20;
    items.push({ label: 'Paragraph length', status: 'pass', detail: 'All paragraphs are a reasonable length' });
  } else if (longParagraphs.length > 0) {
    score += 5;
    items.push({ label: 'Paragraph length', status: 'warning', detail: `${longParagraphs.length} paragraph(s) are too long`, fix: 'Break long paragraphs into 2-4 sentences each. Short paragraphs are much easier to scan on mobile.' });
  }

  // Transition words
  const transitionWords = ['however', 'therefore', 'furthermore', 'moreover', 'additionally', 'consequently', 'meanwhile', 'nevertheless', 'for example', 'in addition', 'as a result', 'on the other hand', 'in conclusion', 'first', 'second', 'finally', 'next', 'then', 'also'];
  const plainLower = plain.toLowerCase();
  const transitionCount = transitionWords.filter(tw => plainLower.includes(tw)).length;
  if (transitionCount >= 3) {
    score += 20;
    items.push({ label: 'Transition words', status: 'pass', detail: `${transitionCount} transition types used — good flow` });
  } else if (transitionCount >= 1) {
    score += 10;
    items.push({ label: 'Transition words', status: 'warning', detail: `Only ${transitionCount} transition word type(s)`, fix: 'Add transition words (however, therefore, for example, additionally) to improve content flow and readability.' });
  } else {
    items.push({ label: 'Transition words', status: 'fail', detail: 'No transition words found', fix: 'Use transition words to connect ideas. Words like "however", "for example", and "additionally" guide readers through your content.' });
  }

  return { name: 'Readability', score: Math.min(score, 100), maxScore: 100, weight: 10, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

function analyzeContentLength(content: string): CategoryResult {
  const plain = stripMarkdown(content);
  const wordCount = plain.split(/\s+/).filter(w => w.length > 0).length;
  const items: CategoryResult['items'] = [];
  let score = 0;

  // Optimal range: 1000-2500 for blog posts
  if (wordCount >= 1000 && wordCount <= 2500) {
    score += 50;
    items.push({ label: 'Word count', status: 'pass', detail: `${wordCount} words — ideal length for ranking` });
  } else if (wordCount >= 500 && wordCount < 1000) {
    score += 30;
    items.push({ label: 'Word count', status: 'warning', detail: `${wordCount} words`, fix: `Content is a bit short. Longer posts (1,000-2,500 words) rank higher on average. Consider expanding key sections.` });
  } else if (wordCount > 2500) {
    score += 35;
    items.push({ label: 'Word count', status: 'warning', detail: `${wordCount} words`, fix: 'Content is quite long. Consider splitting into a series or adding a table of contents for better UX.' });
  } else {
    score += 10;
    items.push({ label: 'Word count', status: 'fail', detail: `Only ${wordCount} words`, fix: 'Content is too short to rank competitively. Expand to at least 500 words, ideally 1,000+.' });
  }

  // Read time
  const readTime = Math.ceil(wordCount / 200);
  if (readTime >= 4 && readTime <= 12) {
    score += 30;
    items.push({ label: 'Read time', status: 'pass', detail: `~${readTime} min read — ideal engagement window` });
  } else if (readTime < 4) {
    score += 15;
    items.push({ label: 'Read time', status: 'warning', detail: `~${readTime} min read`, fix: 'Articles under 4 minutes tend to have lower engagement. Add more depth to keep readers on the page.' });
  } else {
    score += 20;
    items.push({ label: 'Read time', status: 'warning', detail: `~${readTime} min read`, fix: 'Very long articles may lose readers. Add a table of contents and break content into scannable sections.' });
  }

  // Has conclusion / summary
  const contentLower = content.toLowerCase();
  const hasSummary = /#{1,3}\s*(conclusion|summary|final thoughts|wrap.?up|key takeaways|in closing)/i.test(content);
  if (hasSummary) {
    score += 20;
    items.push({ label: 'Conclusion section', status: 'pass', detail: 'Has a conclusion or summary section' });
  } else if (wordCount > 500) {
    score += 5;
    items.push({ label: 'Conclusion section', status: 'warning', detail: 'No conclusion section found', fix: 'Add a "Conclusion" or "Key Takeaways" heading at the end. This helps readers and signals completeness to search engines.' });
  }

  return { name: 'Content Length', score: Math.min(score, 100), maxScore: 100, weight: 8, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

function analyzeUrlSlug(title: string, slug?: string): CategoryResult {
  const generatedSlug = slug || generateSlug(title);
  const items: CategoryResult['items'] = [];
  let score = 0;

  // Length
  if (generatedSlug.length <= 60) {
    score += 35;
    items.push({ label: 'Slug length', status: 'pass', detail: `"${generatedSlug}" (${generatedSlug.length} chars)` });
  } else {
    score += 15;
    items.push({ label: 'Slug length', status: 'warning', detail: `Slug is ${generatedSlug.length} chars`, fix: 'Keep URL slugs under 60 characters. Remove filler words (the, and, is, of) for cleaner URLs.' });
  }

  // No stop words in slug
  const slugWords = generatedSlug.split('-');
  const stopWordsInSlug = slugWords.filter(w => ['the', 'and', 'is', 'of', 'in', 'to', 'a', 'for', 'on', 'with', 'at', 'by'].includes(w));
  if (stopWordsInSlug.length === 0) {
    score += 35;
    items.push({ label: 'Clean slug', status: 'pass', detail: 'No stop words in URL' });
  } else {
    score += 15;
    items.push({ label: 'Stop words in slug', status: 'warning', detail: `Contains: ${stopWordsInSlug.join(', ')}`, fix: `Remove stop words (${stopWordsInSlug.join(', ')}) from the URL slug for a cleaner, more SEO-friendly URL.` });
  }

  // Descriptive
  if (slugWords.length >= 3 && slugWords.length <= 8) {
    score += 30;
    items.push({ label: 'Slug descriptiveness', status: 'pass', detail: `${slugWords.length} words — descriptive and concise` });
  } else if (slugWords.length < 3) {
    score += 15;
    items.push({ label: 'Slug descriptiveness', status: 'warning', detail: 'Slug may be too short', fix: 'Make the URL slug more descriptive (3-8 words) so users and search engines understand the page topic from the URL alone.' });
  } else {
    score += 10;
    items.push({ label: 'Slug length', status: 'warning', detail: `${slugWords.length} words in slug`, fix: 'Slug has too many words. Keep it to 3-8 key terms.' });
  }

  return { name: 'URL Slug', score: Math.min(score, 100), maxScore: 100, weight: 6, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

function analyzeSchemaMarkup(content: string, title: string): CategoryResult {
  const items: CategoryResult['items'] = [];
  let score = 0;

  // Check for FAQ pattern
  const hasQuestions = (content.match(/\?/g) || []).length;
  const hasFaqPattern = /#{2,3}\s*.+\?/gm.test(content);

  if (hasFaqPattern) {
    score += 40;
    items.push({ label: 'FAQ pattern detected', status: 'pass', detail: 'Content has Q&A headings — great for FAQ schema', fix: 'Consider implementing FAQPage schema markup to get rich results in Google.' });
  }

  // Check for how-to pattern
  const hasSteps = /#{2,3}\s*(step|phase|\d+[\.\):])/gi.test(content);
  if (hasSteps) {
    score += 30;
    items.push({ label: 'How-To pattern', status: 'pass', detail: 'Step-by-step content detected — eligible for HowTo schema', fix: 'Add HowTo structured data to get step-by-step rich results in Google.' });
  }

  // Suggestions based on content
  if (!hasFaqPattern && hasQuestions >= 3) {
    score += 20;
    items.push({ label: 'FAQ opportunity', status: 'warning', detail: `${hasQuestions} questions found in content`, fix: 'Format questions as H2/H3 headings with answers below to qualify for FAQ rich results.' });
  }

  // Article schema (always applicable)
  score += 30;
  items.push({ label: 'Article schema', status: 'pass', detail: 'BlogPosting schema will be auto-applied on publish' });

  if (!hasFaqPattern && !hasSteps) {
    items.push({ label: 'Schema opportunities', status: 'warning', detail: 'No advanced schema patterns detected', fix: 'Consider restructuring content as FAQ (question headings) or How-To (numbered steps) to qualify for rich results in Google search.' });
  }

  return { name: 'Schema Markup', score: Math.min(score, 100), maxScore: 100, weight: 6, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

function analyzeMobileFriendliness(content: string): CategoryResult {
  const items: CategoryResult['items'] = [];
  let score = 0;

  // Short paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  const avgParaWords = paragraphs.reduce((sum, p) => sum + stripMarkdown(p).split(/\s+/).length, 0) / Math.max(paragraphs.length, 1);

  if (avgParaWords <= 60) {
    score += 30;
    items.push({ label: 'Paragraph size', status: 'pass', detail: `Average ${Math.round(avgParaWords)} words/paragraph — mobile-friendly` });
  } else {
    score += 10;
    items.push({ label: 'Paragraph size', status: 'warning', detail: `Average ${Math.round(avgParaWords)} words/paragraph`, fix: 'Break paragraphs into 2-3 sentences max. Long text blocks are hard to read on mobile screens.' });
  }

  // Bullet/list usage
  const hasBullets = /^[\s]*[-*+]\s/m.test(content);
  const hasNumberedList = /^[\s]*\d+\.\s/m.test(content);
  if (hasBullets || hasNumberedList) {
    score += 25;
    items.push({ label: 'Lists', status: 'pass', detail: 'Uses bullet or numbered lists for scannability' });
  } else {
    score += 5;
    items.push({ label: 'Lists', status: 'warning', detail: 'No lists found', fix: 'Add bullet points or numbered lists to make content scannable. Mobile users skim — lists help them find key information fast.' });
  }

  // Bold/emphasis for key points
  const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length;
  if (boldCount >= 2) {
    score += 25;
    items.push({ label: 'Text emphasis', status: 'pass', detail: `${boldCount} bold emphasis points help scanning` });
  } else {
    score += 5;
    items.push({ label: 'Text emphasis', status: 'warning', detail: 'Little use of bold text', fix: 'Bold key phrases and important points to help mobile readers scan your content quickly.' });
  }

  // Content breaking (subheadings frequency)
  const headings = extractHeadings(content);
  const wordCount = stripMarkdown(content).split(/\s+/).length;
  const wordsPerHeading = headings.length > 0 ? wordCount / headings.length : wordCount;
  if (wordsPerHeading <= 300 && headings.length > 0) {
    score += 20;
    items.push({ label: 'Content breaks', status: 'pass', detail: `Heading every ~${Math.round(wordsPerHeading)} words — easy to scroll` });
  } else if (headings.length > 0) {
    score += 10;
    items.push({ label: 'Content breaks', status: 'warning', detail: `Only a heading every ~${Math.round(wordsPerHeading)} words`, fix: 'Add more sub-headings. On mobile, users need visual breaks every 200-300 words to stay engaged.' });
  } else {
    items.push({ label: 'Content breaks', status: 'fail', detail: 'No headings for content breaks', fix: 'Add headings throughout your content. Without them, mobile readers see a wall of text and bounce.' });
  }

  return { name: 'Mobile Friendliness', score: Math.min(score, 100), maxScore: 100, weight: 8, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

function analyzeSocialPreview(title: string, content: string, featuredImage?: string): CategoryResult {
  const items: CategoryResult['items'] = [];
  let score = 0;

  // Title length for social
  if (title.length >= 40 && title.length <= 70) {
    score += 25;
    items.push({ label: 'Social title', status: 'pass', detail: `Title length (${title.length} chars) works well for social sharing` });
  } else {
    score += 10;
    items.push({ label: 'Social title', status: 'warning', detail: `Title is ${title.length} chars`, fix: 'Social platforms display 40-70 characters of the title. Adjust length for clean previews on Twitter/LinkedIn.' });
  }

  // Featured image for og:image
  if (featuredImage) {
    score += 35;
    items.push({ label: 'OG image', status: 'pass', detail: 'Featured image set — will be used as og:image for social previews' });
  } else {
    items.push({ label: 'OG image', status: 'fail', detail: 'No featured image set', fix: 'Set a featured image. Posts shared on social media without an image get 80% less engagement. Ideal size: 1200x630px.' });
  }

  // Description / excerpt
  const plainContent = stripMarkdown(content);
  const first160 = plainContent.slice(0, 160);
  if (first160.length >= 80) {
    score += 20;
    items.push({ label: 'Social description', status: 'pass', detail: 'Opening text provides a good social preview snippet' });
  } else {
    score += 5;
    items.push({ label: 'Social description', status: 'warning', detail: 'Opening text is too short for a good preview', fix: 'Write a compelling opening paragraph (80-160 chars) that works as the social media preview text.' });
  }

  // Twitter-specific (checking if content is tweet-threadable)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const shareableQuotes = sentences.filter(s => s.trim().length > 40 && s.trim().length < 280);
  if (shareableQuotes.length >= 2) {
    score += 20;
    items.push({ label: 'Shareable quotes', status: 'pass', detail: `${shareableQuotes.length} tweet-length quotes found for social sharing` });
  } else {
    score += 5;
    items.push({ label: 'Shareable quotes', status: 'warning', detail: 'Few tweet-length sentences', fix: 'Include 2-3 punchy, standalone sentences (under 280 chars) that readers can easily share on Twitter/X.' });
  }

  return { name: 'Social Media Preview', score: Math.min(score, 100), maxScore: 100, weight: 6, status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail', items };
}

// ── Main POST handler ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, title, slug, tags, images, featuredImage, uploadedImageCount } = body;

    if (!content || !title) {
      return NextResponse.json(
        { error: 'Content and title are required' },
        { status: 400 }
      );
    }

    // Run keyword analysis first (other analyzers need topKeywords)
    const keywordResult = analyzeKeywords(content, title);
    const { topKeywords } = keywordResult;

    // Run all analyzers
    const categories: CategoryResult[] = [
      analyzeTitleTag(title, topKeywords),
      analyzeMetaDescription(title, content, topKeywords),
      analyzeHeadingStructure(content),
      keywordResult,
      analyzeLinking(content),
      analyzeImages(content, uploadedImageCount || 0),
      analyzeReadability(content),
      analyzeContentLength(content),
      analyzeUrlSlug(title, slug),
      analyzeSchemaMarkup(content, title),
      analyzeMobileFriendliness(content),
      analyzeSocialPreview(title, content, featuredImage),
    ];

    // Calculate weighted overall score
    const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore = categories.reduce((sum, c) => sum + (c.score * c.weight), 0);
    const overallScore = Math.round(weightedScore / totalWeight);

    // Generate legacy flat feedback for backward compat
    const feedback = categories.flatMap(cat =>
      cat.items.map(item => ({
        type: item.status === 'pass' ? 'success' as const : item.status === 'warning' ? 'warning' as const : 'error' as const,
        message: item.detail,
      }))
    );

    // Compute quick stats
    const plainContent = stripMarkdown(content);
    const words = plainContent.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = plainContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
    const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
    const readabilityScore = Math.round(fleschKincaid(wordCount, sentenceCount, totalSyllables));
    const readTime = Math.ceil(wordCount / 200);
    const headings = extractHeadings(content);

    return NextResponse.json({
      score: overallScore,
      categories,
      details: {
        wordCount,
        sentenceCount,
        avgWordsPerSentence,
        titleLength: title.length,
        titleWords: title.split(/\s+/).length,
        headingCount: headings.length,
        readabilityScore,
        readTime,
        topKeywords,
      },
      feedback,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
