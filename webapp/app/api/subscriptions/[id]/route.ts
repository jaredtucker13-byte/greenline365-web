import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { createServerClient } from '@/lib/supabase/server';
import { bustFeatureCache } from '@/lib/services/feature-resolution';

// PATCH /api/subscriptions/[id] — update subscription (e.g., cancel at period end)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { user } = auth;
  const { id } = await params;
  const serviceClient = createServerClient();
  const body = await request.json();

  // Verify ownership
  const { data: existing, error: fetchError } = await serviceClient
    .from('subscriptions')
    .select('id, account_id, listing_id')
    .eq('id', id)
    .eq('account_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  // Allow updating: status, cancel_at_period_end, billing_cycle, plan_id
  const allowedFields = ['status', 'cancel_at_period_end', 'billing_cycle', 'plan_id'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: updated, error } = await serviceClient
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  bustFeatureCache(user.id, existing.listing_id || undefined);

  return NextResponse.json({ subscription: updated });
}

// DELETE /api/subscriptions/[id] — cancel subscription immediately
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { user } = auth;
  const { id } = await params;
  const serviceClient = createServerClient();

  // Verify ownership
  const { data: existing, error: fetchError } = await serviceClient
    .from('subscriptions')
    .select('id, account_id, listing_id, stripe_subscription_id')
    .eq('id', id)
    .eq('account_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  // Update status to canceled
  const { error } = await serviceClient
    .from('subscriptions')
    .update({ status: 'canceled', cancel_at_period_end: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  bustFeatureCache(user.id, existing.listing_id || undefined);

  return NextResponse.json({ message: 'Subscription canceled' });
}
