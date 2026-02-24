import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterJSON } from '@/lib/openrouter';

/**
 * Image Analysis API - "Autopilot Mode"
 *
 * Analyzes an uploaded image and generates:
 * - Title/Name
 * - Caption (social media ready)
 * - Product Description
 * - Keywords/Tags
 * - Hashtags
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, imageUrl, contentType = 'photo', businessType = 'local business', location = 'Tampa, FL' } = body;

    if (!imageData && !imageUrl) {
      return NextResponse.json(
        { error: 'Image data or URL is required' },
        { status: 400 }
      );
    }

    const imageContent = imageData
      ? { type: 'image_url', image_url: { url: imageData } }
      : { type: 'image_url', image_url: { url: imageUrl } };

    const analysisPrompt = getAnalysisPrompt(contentType, businessType, location);

    let analysis;
    try {
      const { parsed } = await callOpenRouterJSON({
        model: 'anthropic/claude-opus-4.6',
        messages: [
          {
            role: 'system',
            content: `You are a creative marketing expert who analyzes images for small businesses. You create engaging, authentic content that sounds human - not robotic or generic.

Your job is to analyze images and generate marketing content that:
- Tells a story
- Connects emotionally with the audience
- Uses industry-specific language
- Includes actionable calls-to-action
- Feels personal and authentic

IMPORTANT: Return ONLY valid JSON. No markdown, no extra text, just the JSON object.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              imageContent
            ]
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
        caller: 'GL365 Image Analyzer',
      });
      analysis = parsed;
    } catch (parseError) {
      console.error('Image analysis parse error:', parseError);
      analysis = generateFallbackAnalysis(contentType);
    }

    const result = {
      success: true,
      analysis: {
        title: analysis.title || 'Untitled',
        caption: analysis.caption || '',
        productDescription: analysis.productDescription || analysis.description || '',
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
        hashtags: {
          brand: analysis.hashtags?.brand || '#GreenLine365',
          local: analysis.hashtags?.local || `#${location.split(',')[0].replace(/\s+/g, '')}`,
          suggested: Array.isArray(analysis.hashtags?.suggested) ? analysis.hashtags.suggested : [],
        },
        mood: analysis.mood || 'professional',
        suggestedPlatforms: analysis.suggestedPlatforms || ['instagram', 'facebook'],
        callToAction: analysis.callToAction || 'Learn more today!',
      },
      metadata: {
        contentType,
        businessType,
        location,
        analyzedAt: new Date().toISOString(),
      }
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image', details: error.message },
      { status: 500 }
    );
  }
}

function getAnalysisPrompt(contentType: string, businessType: string, location: string): string {
  const basePrompt = `Analyze this image for a ${businessType} in ${location}. `;

  const typeSpecificPrompt = {
    photo: `This is a general photo post for social media.

Generate content that:
- Captures the essence and story of this image
- Creates engagement and connection
- Works well on Instagram, Facebook, and Twitter`,

    product: `This is a PRODUCT image that needs to sell.

Generate content that:
- Highlights the product's features and benefits
- Creates desire and urgency
- Includes a clear value proposition
- Works for e-commerce and social selling`,

    blog: `This will be used as a BLOG header image.

Generate content that:
- Suggests an engaging blog topic based on the image
- Creates SEO-friendly title and description
- Includes content ideas for a full blog post
- Appeals to readers searching for related topics`,
  };

  return `${basePrompt}${typeSpecificPrompt[contentType as keyof typeof typeSpecificPrompt] || typeSpecificPrompt.photo}

Return a JSON object with this EXACT structure:
{
  "title": "Catchy, engaging title (max 60 chars)",
  "caption": "Social media caption with personality. Include 1-2 emojis naturally. Make it feel human and authentic, not corporate. 2-4 sentences max.",
  "productDescription": "Detailed description focusing on benefits and value. 2-3 sentences.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "hashtags": {
    "brand": "#BusinessName",
    "local": "#${location.split(',')[0].replace(/\s+/g, '')}",
    "suggested": ["#relevant1", "#relevant2", "#relevant3", "#trending1", "#niche1"]
  },
  "mood": "professional|playful|inspiring|urgent|casual",
  "suggestedPlatforms": ["instagram", "facebook"],
  "callToAction": "Short, actionable CTA"
}`;
}

function generateFallbackAnalysis(contentType: string) {
  return {
    title: contentType === 'product' ? 'New Product Spotlight' : 'Check This Out',
    caption: "Something special for you today! We're excited to share this with our community. What do you think? 💫",
    productDescription: 'Quality you can trust, service you deserve. Discover what makes us different.',
    keywords: ['quality', 'local business', 'community', 'service', 'trusted'],
    hashtags: {
      brand: '#GreenLine365',
      local: '#Tampa',
      suggested: ['#SmallBusiness', '#LocalLove', '#SupportLocal', '#Community', '#Quality'],
    },
    mood: 'professional',
    suggestedPlatforms: ['instagram', 'facebook'],
    callToAction: 'Visit us today!',
  };
}
