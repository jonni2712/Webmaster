import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { assertHasFeature, PlanLimitError } from '@/lib/billing/limits';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as { current_tenant_id?: string };
  const supabase = createAdminClient();

  // Enforce scanner feature gate.
  try {
    await assertHasFeature(user.current_tenant_id!, 'scanner');
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { ok: false, error: "Funzionalita' scanner non disponibile con il tuo piano. Effettua l'upgrade." },
        { status: 403 }
      );
    }
    throw err;
  }

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
