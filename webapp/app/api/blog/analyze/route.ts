import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// POST /api/blog/analyze - Analyze blog content for SEO
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, title } = body;
    
    if (!content || !title) {
      return NextResponse.json(
        { error: 'Content and title are required' },
        { status: 400 }
      );
    }
    
    // Analyze content
    const wordCount = content.split(/\s+/).filter((w: string) => w).length;
    const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim());
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = wordCount / sentenceCount || 0;
    
    // Check for headings
    const headings = content.match(/#{1,6}\s.+/g) || [];
    const hasHeadings = headings.length > 0;
    
    // Title analysis
    const titleLength = title.length;
    const titleWords = title.split(/\s+/).length;
    
    // Keywords (simple extraction - top 10 words)
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq: Record<string, number> = {};
    words.forEach((word: string) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    const topKeywords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    // Calculate SEO score
    let score = 0;
    const feedback = [];
    
    // Word count (500-2500 optimal)
    if (wordCount >= 500 && wordCount <= 2500) {
      score += 25;
      feedback.push({ type: 'success', message: 'Good content length' });
    } else if (wordCount < 500) {
      score += 10;
      feedback.push({ type: 'warning', message: `Content is short (${wordCount} words). Aim for 500-2500 words.` });
    } else {
      score += 15;
      feedback.push({ type: 'info', message: 'Content is lengthy. Consider breaking into series.' });
    }
    
    // Title length (50-60 chars optimal)
    if (titleLength >= 50 && titleLength <= 60) {
      score += 20;
      feedback.push({ type: 'success', message: 'Perfect title length for SEO' });
    } else if (titleLength >= 40 && titleLength <= 70) {
      score += 15;
      feedback.push({ type: 'info', message: 'Good title length' });
    } else {
      score += 5;
      feedback.push({ type: 'warning', message: `Title ${titleLength < 40 ? 'too short' : 'too long'}. Aim for 50-60 characters.` });
    }
    
    // Headings
    if (hasHeadings) {
      score += 15;
      feedback.push({ type: 'success', message: `${headings.length} headings found - good structure` });
    } else {
      feedback.push({ type: 'warning', message: 'Add headings (H2, H3) to improve readability' });
    }
    
    // Readability (Flesch-Kincaid approximation)
    const readabilityScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * (wordCount / sentences.length);
    if (readabilityScore >= 60) {
      score += 20;
      feedback.push({ type: 'success', message: 'Easy to read' });
    } else if (readabilityScore >= 40) {
      score += 15;
      feedback.push({ type: 'info', message: 'Moderately readable' });
    } else {
      score += 10;
      feedback.push({ type: 'warning', message: 'Content may be hard to read. Use shorter sentences.' });
    }
    
    // Keyword density
    if (topKeywords.length > 0) {
      score += 10;
      feedback.push({ type: 'success', message: 'Keywords detected' });
    }
    
    // Paragraph length (check for walls of text)
    const paragraphs = content.split(/\n\n+/);
    const longParagraphs = paragraphs.filter((p: string) => p.split(/\s+/).length > 150);
    if (longParagraphs.length > 0) {
      score += 5;
      feedback.push({ type: 'warning', message: `${longParagraphs.length} paragraphs are too long. Break them up.` });
    } else {
      score += 10;
      feedback.push({ type: 'success', message: 'Good paragraph lengths' });
    }
    
    const readTime = Math.ceil(wordCount / 200);
    
    return NextResponse.json({
      score: Math.min(score, 100),
      details: {
        wordCount,
        sentenceCount,
        avgWordsPerSentence: Math.round(avgWordsPerSentence),
        titleLength,
        titleWords,
        headingCount: headings.length,
        readabilityScore: Math.round(readabilityScore),
        readTime,
        topKeywords,
      },
      feedback,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
