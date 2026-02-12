import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Generate report sections from AI analysis
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { incident_id } = body;

    if (!incident_id) {
      return NextResponse.json({ error: 'Missing incident_id' }, { status: 400 });
    }

    // Get incident with images
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select(`
        *,
        incident_images (*)
      `)
      .eq('id', incident_id)
      .eq('user_id', user.id)
      .single();

    if (incidentError) throw incidentError;

    // Compile all image analyses
    const imageAnalyses = incident.incident_images
      .filter((img: any) => img.ai_analysis && Object.keys(img.ai_analysis).length > 0)
      .map((img: any) => ({
        filename: img.filename,
        url: img.url,
        analysis: img.ai_analysis,
        caption: img.caption || img.ai_analysis?.suggested_caption
      }));

    // Generate comprehensive report using GPT-4o
    const reportPrompt = `You are a professional HVAC liability documentation specialist. Based on the following incident data and image analyses, generate a comprehensive incident report.

INCIDENT INFO:
- Title: ${incident.title}
- Description: ${incident.description || 'Not provided'}
- Customer: ${incident.customer_name || 'Not provided'}
- Property: ${incident.property_address || 'Not provided'}
- Date: ${new Date(incident.created_at).toLocaleDateString()}

IMAGE ANALYSES:
${JSON.stringify(imageAnalyses, null, 2)}

Generate a professional incident report with these EXACT sections in JSON format:
{
  "executive_summary": "2-3 sentence overview of the incident and key findings",
  "timeline": [
    {
      "date": "Date string",
      "event": "What happened",
      "source": "How this was documented"
    }
  ],
  "findings": [
    {
      "issue": "Issue name",
      "severity": "low|medium|high|critical",
      "description": "Detailed description",
      "evidence": "Reference to specific images/documentation",
      "recommended_action": "What should be done"
    }
  ],
  "overall_risk_assessment": {
    "level": "low|medium|high|critical",
    "summary": "Overall risk summary",
    "immediate_concerns": ["List of immediate concerns"],
    "long_term_concerns": ["List of long-term concerns"]
  },
  "recommendations": [
    {
      "priority": 1,
      "action": "Recommended action",
      "reason": "Why this is needed",
      "estimated_urgency": "immediate|within_week|within_month|routine"
    }
  ],
  "liability_statement": "Professional liability statement noting that this report documents conditions as observed and does not constitute admission of liability by any party. Customer acknowledgment indicates review of findings only."
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://greenline365.com',
        'X-Title': 'GreenLine365 Report Generation'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.6',
        messages: [
          { role: 'system', content: 'You are a professional incident documentation specialist. Always respond with valid JSON only.' },
          { role: 'user', content: reportPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const result = await response.json();
    const reportText = result.choices?.[0]?.message?.content || '';

    // Parse JSON
    let reportSections;
    try {
      const jsonMatch = reportText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        reportText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : reportText;
      reportSections = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse report JSON:', reportText);
      reportSections = {
        executive_summary: 'Report generation completed. Please review findings.',
        findings: imageAnalyses.map((img: any) => img.analysis?.findings || []).flat(),
        recommendations: [],
        liability_statement: 'This report documents conditions as observed at the time of inspection.'
      };
    }

    // Compile overall AI analysis
    const allIssues = imageAnalyses.flatMap((img: any) => img.analysis?.detected_issues || []);
    const uniqueIssues = [...new Set(allIssues)];
    const severities = imageAnalyses.map((img: any) => img.analysis?.severity).filter(Boolean);
    const overallSeverity = severities.includes('critical') ? 'critical' :
                           severities.includes('high') ? 'high' :
                           severities.includes('medium') ? 'medium' : 'low';

    const aiAnalysis = {
      detected_issues: uniqueIssues,
      risk_level: overallSeverity,
      summary: reportSections.executive_summary,
      image_count: imageAnalyses.length,
      generated_at: new Date().toISOString()
    };

    // Update incident with report sections and AI analysis
    const { data: updatedIncident, error: updateError } = await supabase
      .from('incidents')
      .update({
        report_sections: reportSections,
        ai_analysis: aiAnalysis,
        severity: overallSeverity,
        status: 'pending_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', incident_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      incident: updatedIncident,
      report_sections: reportSections
    });

  } catch (error: any) {
    console.error('POST /api/incidents/generate-report error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
