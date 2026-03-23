import { NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/agent/auth';
import { agentHeartbeatSchema } from '@/lib/agent/schemas';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const auth = await authenticateAgent(request);
  if (!auth.success) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.error === 'Missing Authorization header' ? 401 : 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = agentHeartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  await supabase
    .from('servers')
    .update({
      last_heartbeat_at: new Date().toISOString(),
      agent_status: 'online',
      agent_version: parsed.data.agent_version,
    })
    .eq('id', auth.serverId!);

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
