/**
 * Email Engine — Auto-Send Rules CRUD
 * GET:    List all auto-send rules
 * POST:   Create new rule
 * PUT:    Update rule
 * DELETE: Delete rule
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLE = 'email_auto_rules';

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table may not exist yet — return empty array
      console.warn('[Auto Rules] GET error (table may not exist):', error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('[Auto Rules] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { name, trigger, templateId, schedule, humanWaitGate } = await request.json();

    if (!name || !trigger) {
      return NextResponse.json({ error: 'name and trigger are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        name,
        trigger,
        template_id: templateId || null,
        schedule: schedule || null,
        status: 'active',
        human_wait_gate: humanWaitGate ?? false,
        execution_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Auto Rules] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('[Auto Rules] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Map camelCase to snake_case
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.trigger !== undefined) dbUpdates.trigger = updates.trigger;
    if (updates.templateId !== undefined) dbUpdates.template_id = updates.templateId;
    if (updates.schedule !== undefined) dbUpdates.schedule = updates.schedule;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.humanWaitGate !== undefined) dbUpdates.human_wait_gate = updates.humanWaitGate;

    const { data, error } = await supabase
      .from(TABLE)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Auto Rules] PUT error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Auto Rules] PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase.from(TABLE).delete().eq('id', id);

    if (error) {
      console.error('[Auto Rules] DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Auto Rules] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
