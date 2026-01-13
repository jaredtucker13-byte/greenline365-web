import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// HVAC-specific analysis prompt
const HVAC_ANALYSIS_PROMPT = `You are an expert HVAC inspector and liability documentation specialist. Analyze this image for an incident report.

IDENTIFY AND REPORT ON:

1. **Biological Growth & Contamination:**
   - Mold (black, green, white, fuzzy growth patterns)
   - Mildew
   - Algae (especially on outdoor units)
   - Bacterial growth
   - Fungal contamination

2. **Water Damage:**
   - Water staining (brown/yellow marks)
   - Active leaks or moisture
   - Condensation issues
   - Flood damage evidence
   - Standing water

3. **Physical Damage:**
   - Corrosion/rust
   - Bent or damaged fins
   - Dents or impact damage
   - Cracked components
   - Missing parts

4. **Safety Hazards:**
   - Exposed wiring
   - Improper installation
   - Fire risks
   - Refrigerant leaks (oil stains)
   - Carbon monoxide risks

5. **Maintenance Issues:**
   - Dirty coils/filters
   - Debris accumulation
   - Vegetation overgrowth
   - Pest infestation signs
   - Neglected equipment

RESPOND IN THIS EXACT JSON FORMAT:
{
  "detected_issues": ["issue1", "issue2"],
  "severity": "low|medium|high|critical",
  "description": "Detailed description of what you see",
  "findings": [
    {
      "issue": "Issue name",
      "severity": "low|medium|high|critical",
      "location": "Where in the image",
      "details": "Specific details",
      "recommended_action": "What should be done"
    }
  ],
  "suggested_caption": "Professional caption for this image in a report",
  "liability_notes": "Any liability-relevant observations",
  "confidence": 0.0-1.0
}`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { incident_id, image_url, image_base64 } = body;

    if (!incident_id) {
      return NextResponse.json({ error: 'Missing incident_id' }, { status: 400 });
    }

    if (!image_url && !image_base64) {
      return NextResponse.json({ error: 'Missing image_url or image_base64' }, { status: 400 });
    }

    // Prepare image content for GPT-4o
    const imageContent = image_base64 
      ? { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
      : { type: 'image_url', image_url: { url: image_url } };

    // Call GPT-4o via OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://greenline365.com',
        'X-Title': 'GreenLine365 Incident Analysis'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: HVAC_ANALYSIS_PROMPT
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this HVAC-related image for an incident liability report:' },
              imageContent
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    let analysis;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisText;
      analysis = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse analysis JSON:', analysisText);
      analysis = {
        detected_issues: [],
        severity: 'medium',
        description: analysisText,
        findings: [],
        suggested_caption: 'Image analysis completed',
        confidence: 0.5
      };
    }

    return NextResponse.json({
      success: true,
      analysis,
      raw_response: analysisText
    });

  } catch (error: any) {
    console.error('POST /api/incidents/analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
