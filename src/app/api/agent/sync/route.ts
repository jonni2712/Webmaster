import { NextResponse } from 'next/server';
import { authenticateAgent } from '@/lib/agent/auth';
import { agentSyncPayloadSchema } from '@/lib/agent/schemas';
import { processSyncPayload } from '@/lib/agent/sync-processor';

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

  const parsed = agentSyncPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await processSyncPayload(auth.serverId!, auth.tenantId!, parsed.data);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error('[agent/sync] Processing error:', err);
    return NextResponse.json(
      { ok: false, error: 'Internal processing error' },
      { status: 500 }
    );
  }
}
