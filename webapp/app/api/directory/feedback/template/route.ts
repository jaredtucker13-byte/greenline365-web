import { NextRequest, NextResponse } from 'next/server';
import { getTemplatesForIndustry } from '@/lib/poll-templates';

// GET /api/directory/feedback/template?industry=dining
// Returns the best-match poll template for a given industry
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get('industry');

  if (!industry) {
    return NextResponse.json({ error: 'industry parameter required' }, { status: 400 });
  }

  const templates = getTemplatesForIndustry(industry);

  // Return the first (most specific) template
  if (templates.length > 0) {
    return NextResponse.json(templates[0]);
  }

  return NextResponse.json({ error: 'No template found' }, { status: 404 });
}
