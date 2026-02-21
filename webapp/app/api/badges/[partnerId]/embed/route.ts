import { NextRequest, NextResponse } from 'next/server';

const VALID_STYLES = ['default', 'minimal', 'compact'] as const;

/**
 * GET /api/badges/[partnerId]/embed?style=default|minimal|compact
 * Returns a ready-to-paste HTML snippet for external partner sites.
 * Content-Type: text/plain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const { partnerId } = await params;
  const { searchParams } = new URL(request.url);
  const rawStyle = searchParams.get('style') || 'default';
  const style = VALID_STYLES.includes(rawStyle as any) ? rawStyle : 'default';

  const snippet = `<div data-gl365-badge data-partner-id="${partnerId}" data-style="${style}"></div>\n<script src="https://greenline365.com/badge.js" defer async></script>`;

  return new NextResponse(snippet, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=300',
    },
  });
}
