import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { resolveFeatures } from '@/lib/services/feature-resolution';

// GET /api/features/resolved — returns resolved features for current user
// Optional query param: ?listing_id=<uuid>
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { user } = auth;
  const url = new URL(request.url);
  const listingId = url.searchParams.get('listing_id') ?? undefined;

  try {
    const features = await resolveFeatures(user.id, listingId);
    return NextResponse.json({ features });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resolve features';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
