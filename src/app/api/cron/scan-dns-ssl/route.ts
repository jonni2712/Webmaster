import { NextResponse } from 'next/server';
import { getAllTenantIds } from '@/lib/scanner/domain-collector';
import { runDnsSslScan } from '@/lib/scanner/orchestrator';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantIds = await getAllTenantIds();
  const results = [];

  for (const tenantId of tenantIds) {
    try {
      const summary = await runDnsSslScan(tenantId);
      results.push({ tenantId, ...summary });
    } catch (err) {
      results.push({ tenantId, error: String(err) });
    }
  }

  return NextResponse.json({ ok: true, results });
}
