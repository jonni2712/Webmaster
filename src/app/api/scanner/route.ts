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
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('external_scan_results')
    .select('*')
    .eq('tenant_id', user.current_tenant_id)
    .order('domain');

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, results: data });
}
