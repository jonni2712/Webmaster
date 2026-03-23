import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as { current_tenant_id?: string };
  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get('server_id');

  const supabase = createAdminClient();
  let query = supabase
    .from('pending_site_imports')
    .select('*')
    .eq('tenant_id', user.current_tenant_id)
    .eq('status', 'pending')
    .order('discovered_at', { ascending: false });

  if (serverId) {
    query = query.eq('server_id', serverId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, imports: data });
}
