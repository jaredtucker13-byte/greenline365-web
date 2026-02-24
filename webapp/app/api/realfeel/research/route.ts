import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callOpenRouterJSON } from '@/lib/openrouter';

/**
 * Perplexity Research API
 *
 * Uses OpenRouter's Perplexity Sonar model for real-time business research
 * Used during warm transfers to generate sales briefs
 *
 * POST /api/realfeel/research
 */

interface ResearchRequest {
  business_id: string;
  prospect_website?: string;
  prospect_name?: string;
  prospect_company?: string;
  research_type: 'sales_brief' | 'company_overview' | 'competitor_analysis';
  additional_context?: string;
}

interface SalesBrief {
  company_name: string;
  industry: string;
  key_services: string[];
  potential_pain_points: string[];
  talking_points: string[];
  recent_news?: string;
  whisper_script: string;
}

// Generate research using Perplexity via OpenRouter
async function generateResearch(
  website: string,
  companyName: string | undefined,
  researchType: string,
  additionalContext?: string
): Promise<SalesBrief> {
  
  const systemPrompt = `You are a sales intelligence analyst. Generate concise, actionable research for a sales representative who is about to receive a warm transfer call.

Your output must be:
1. Specific and factual (based on real information from the web)
2. Focused on sales opportunities
3. Brief enough to be consumed in 30 seconds

Format your response as JSON with this structure:
{
  "company_name": "Company Name",
  "industry": "Their industry",
  "key_services": ["Service 1", "Service 2"],
  "potential_pain_points": ["Pain point 1", "Pain point 2"],
  "talking_points": ["Conversation starter 1", "Relevant talking point 2"],
  "recent_news": "Any recent company news or updates",
  "whisper_script": "A 10-second script for the sales rep to hear before the call connects"
}`;

  const userPrompt = `Research this prospect for a sales call:

Website: ${website}
${companyName ? `Company Name: ${companyName}` : ''}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Research Type: ${researchType}

Generate a sales brief that will help our rep have a more informed conversation. Focus on:
1. What they do and their target market
2. Potential problems we might solve for them
3. Good conversation openers based on their business

The whisper_script should be ~10 seconds when read aloud and include:
- Who is calling and from what company
- One key insight about their business
- One potential upsell/hook based on current conditions`;

  try {
    const { parsed } = await callOpenRouterJSON<SalesBrief>({
      model: 'perplexity/sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      caller: 'realfeel-generateResearch',
    });

    return parsed;
  } catch (error) {
    console.error('[Perplexity] Research error:', error);

    // Fallback structure
    return {
      company_name: companyName || 'Unknown Company',
      industry: 'Unknown',
      key_services: [],
      potential_pain_points: [],
      talking_points: ['Ask about their current challenges', 'Discuss their growth plans'],
      whisper_script: `Transferring call from ${companyName || 'a prospect'}. Be prepared to discuss their business needs.`
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body: ResearchRequest = await request.json();
    const { 
      business_id, 
      prospect_website, 
      prospect_name, 
      prospect_company,
      research_type = 'sales_brief',
      additional_context 
    } = body;
    
    if (!business_id) {
      return NextResponse.json({ error: 'business_id required' }, { status: 400 });
    }
    
    if (!prospect_website && !prospect_company) {
      return NextResponse.json({ 
        error: 'Either prospect_website or prospect_company required' 
      }, { status: 400 });
    }
    
    // Verify user has access to business
    const { data: userBusiness } = await supabase
      .from('user_businesses')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', business_id)
      .single();
    
    if (!userBusiness) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Generate research
    const research = await generateResearch(
      prospect_website || `${prospect_company} company`,
      prospect_company,
      research_type,
      additional_context
    );
    
    // Store in warm transfer queue if this is for a live transfer
    if (body.additional_context?.includes('warm_transfer')) {
      await supabase.from('warm_transfer_queue').insert({
        business_id,
        caller_name: prospect_name,
        caller_company: prospect_company,
        prospect_website,
        perplexity_research: research,
        whisper_script: research.whisper_script,
        status: 'ready',
        research_completed_at: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: true,
      research,
      generated_at: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[Research API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Retrieve existing research from queue
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    const transferId = searchParams.get('transfer_id');
    
    if (!businessId) {
      return NextResponse.json({ error: 'business_id required' }, { status: 400 });
    }
    
    let query = supabase
      .from('warm_transfer_queue')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (transferId) {
      query = query.eq('id', transferId);
    } else {
      query = query.limit(10);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      transfers: data
    });
    
  } catch (error: any) {
    console.error('[Research GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
