import { NextRequest, NextResponse } from 'next/server';
import { POLL_TEMPLATES, getTemplatesForIndustry, getTemplateById } from '@/lib/poll-templates';

/**
 * GET /api/directory/addons/poll-templates
 * Returns available poll templates, optionally filtered by industry.
 * 
 * Query params:
 *   ?industry=dining — returns templates relevant to dining
 *   (no params) — returns all 7 templates
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get('industry');

  if (industry) {
    return NextResponse.json({
      templates: getTemplatesForIndustry(industry),
      total: getTemplatesForIndustry(industry).length,
    });
  }

  return NextResponse.json({
    templates: POLL_TEMPLATES,
    total: POLL_TEMPLATES.length,
  });
}
