import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/roles — list all roles with their permissions
export async function GET() {
  const supabase = await createClient();

  const { data: roles, error } = await supabase
    .from('roles')
    .select(`
      id, slug, name, description, is_system,
      role_permissions(
        permission:permissions(id, slug, product_scope, description)
      )
    `)
    .order('slug', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ roles });
}
