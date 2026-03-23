import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { current_tenant_id?: string };

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { action } = body;
  if (!['import', 'ignore'].includes(action)) {
    return NextResponse.json({ ok: false, error: 'action must be import or ignore' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: pending, error } = await supabase
    .from('pending_site_imports')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .eq('status', 'pending')
    .single();

  if (error || !pending) {
    return NextResponse.json({ ok: false, error: 'Import not found' }, { status: 404 });
  }

  if (action === 'ignore') {
    await supabase
      .from('pending_site_imports')
      .update({ status: 'ignored', actioned_at: new Date().toISOString() })
      .eq('id', id);
    return NextResponse.json({ ok: true, status: 'ignored' });
  }

  // action === 'import'
  const { data: newSite, error: siteError } = await supabase
    .from('sites')
    .insert({
      tenant_id: user.current_tenant_id,
      url: `https://${pending.domain}`,
      name: pending.domain,
      platform: pending.cms_type || 'other',
      server_id: pending.server_id,
      is_active: true,
      monitoring_enabled: true,
    })
    .select('id')
    .single();

  if (siteError || !newSite) {
    return NextResponse.json({ ok: false, error: siteError?.message }, { status: 500 });
  }

  await supabase
    .from('server_cms_detections')
    .update({ matched_site_id: newSite.id })
    .eq('tenant_id', user.current_tenant_id)
    .eq('domain', pending.domain);

  await supabase
    .from('pending_site_imports')
    .update({ status: 'imported', actioned_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json({ ok: true, status: 'imported', site_id: newSite.id });
}
