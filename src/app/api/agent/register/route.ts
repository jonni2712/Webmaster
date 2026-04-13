import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateAgentToken } from '@/lib/agent/token';
import { getAppBaseUrl } from '@/lib/urls';
import { assertHasFeature, PlanLimitError } from '@/lib/billing/limits';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const sessionUser = session.user as { current_tenant_id?: string };

  // Enforce agent feature gate.
  try {
    await assertHasFeature(sessionUser.current_tenant_id!, 'agent');
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { ok: false, error: "Funzionalita' agent non disponibile con il tuo piano. Effettua l'upgrade." },
        { status: 403 }
      );
    }
    throw err;
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

  // Verify server belongs to user's tenant
  const { data: server, error } = await supabase
    .from('servers')
    .select('id, tenant_id')
    .eq('id', server_id)
    .eq('tenant_id', sessionUser.current_tenant_id)
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

  const baseUrl = getAppBaseUrl();

  return NextResponse.json({
    ok: true,
    agent_token: agentToken,
    install_command: `curl -sL "${baseUrl}/api/agent/install.sh" | bash -s -- --token="${agentToken}" --url="${baseUrl}"`,
  });
}
