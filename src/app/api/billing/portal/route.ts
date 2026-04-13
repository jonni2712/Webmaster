import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get user's current tenant
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.current_tenant_id) {
    return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
  }

  const tenantId = user.current_tenant_id;

  // Get the tenant's stripe_customer_id
  const { data: tenant } = await supabase
    .from('tenants')
    .select('stripe_customer_id')
    .eq('id', tenantId)
    .single();

  if (!tenant?.stripe_customer_id) {
    return NextResponse.json({ error: 'Nessun abbonamento attivo' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Create Stripe Customer Portal session
  let portalSession: Awaited<ReturnType<typeof stripe.billingPortal.sessions.create>>;
  try {
    portalSession = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${appUrl}/settings?tab=billing`,
    });
  } catch (err) {
    console.error('[billing/portal] Stripe portal session creation failed:', err);
    return NextResponse.json(
      { error: 'Errore nella creazione della sessione del portale' },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: portalSession.url }, { status: 200 });
}
