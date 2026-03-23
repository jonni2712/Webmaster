import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAgentToken } from '@/lib/agent/token';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { server_id, panel_type } = body;
  if (!server_id || !panel_type) {
    return NextResponse.json(
      { ok: false, error: 'server_id and panel_type required' },
      { status: 400 }
    );
  }

  if (!['cpanel', 'plesk'].includes(panel_type)) {
    return NextResponse.json(
      { ok: false, error: 'panel_type must be cpanel or plesk' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const user = session.user as { current_tenant_id?: string };

  // Verify server belongs to user's tenant
  const { data: server, error } = await supabase
    .from('servers')
    .select('id, tenant_id')
    .eq('id', server_id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (error || !server) {
    return NextResponse.json({ ok: false, error: 'Server not found' }, { status: 404 });
  }

  const agentToken = generateAgentToken(server_id);

  await supabase
    .from('servers')
    .update({
      panel_type,
      agent_token: agentToken,
      agent_status: 'not_installed',
    })
    .eq('id', server_id);

  const baseUrl = process.env.NEXTAUTH_URL || 'https://app.webmaster-monitor.com';

  return NextResponse.json({
    ok: true,
    agent_token: agentToken,
    install_command: `curl -sL "${baseUrl}/api/agent/install.sh" | bash -s -- --token="${agentToken}" --url="${baseUrl}"`,
  });
}
