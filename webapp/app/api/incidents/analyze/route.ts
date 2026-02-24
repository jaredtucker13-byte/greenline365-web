import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { HTML_FORMAT_DIRECTIVE } from '@/lib/format-standards';
import { callOpenRouterJSON } from '@/lib/openrouter';

// HVAC-specific analysis prompt
const HVAC_ANALYSIS_PROMPT = `You are an expert HVAC inspector and liability documentation specialist. Analyze this image for an incident report.
${HTML_FORMAT_DIRECTIVE}
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

    // Prepare image content
    const imageContent = image_base64
      ? { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` } }
      : { type: 'image_url', image_url: { url: image_url } };

    let analysis;
    let rawResponse = '';
    try {
      const { parsed, content } = await callOpenRouterJSON({
        model: 'anthropic/claude-opus-4.6',
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
        temperature: 0.3,
        caller: 'GL365 Incident Analyzer',
      });
      analysis = parsed;
      rawResponse = content;
    } catch (e) {
      console.error('Failed to parse analysis JSON:', e);
      analysis = {
        detected_issues: [],
        severity: 'medium',
        description: 'Analysis parsing failed',
        findings: [],
        suggested_caption: 'Image analysis completed',
        confidence: 0.5
      };
    }

    return NextResponse.json({
      success: true,
      analysis,
      raw_response: rawResponse
    });

  } catch (error: any) {
    console.error('POST /api/incidents/analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
