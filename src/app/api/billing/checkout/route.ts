import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { getOrCreateStripeCustomer } from '@/lib/stripe/helpers';
import { getPlan } from '@/lib/billing/plans';
import type { PlanId } from '@/lib/billing/plans';

const PAID_PLANS: PlanId[] = ['pro', 'business', 'agency'];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  let body: { planId?: string; annual?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo della richiesta non valido' }, { status: 400 });
  }

  const { planId, annual = false } = body;

  // Validate planId is one of the paid plans
  if (!planId || !PAID_PLANS.includes(planId as PlanId)) {
    return NextResponse.json(
      { error: 'Piano non valido. Scegli tra: pro, business, agency' },
      { status: 400 }
    );
  }

  // Get tenant ID from the user's current tenant
  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.current_tenant_id) {
    return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
  }

  const tenantId = user.current_tenant_id;

  // Look up the plan's stripe_price_id
  const plan = await getPlan(planId as PlanId);
  if (!plan) {
    return NextResponse.json({ error: 'Piano non trovato' }, { status: 404 });
  }

  // For now, use the monthly price. Annual pricing can be added when annual price IDs are populated.
  const stripePriceId = plan.stripePriceId;
  if (!stripePriceId) {
    return NextResponse.json(
      { error: 'Prezzo Stripe non configurato per questo piano' },
      { status: 500 }
    );
  }

  // Get or create Stripe customer for this tenant
  let customerId: string;
  try {
    customerId = await getOrCreateStripeCustomer(tenantId);
  } catch (err) {
    console.error('[billing/checkout] Failed to get/create Stripe customer:', err);
    return NextResponse.json({ error: 'Errore nella creazione del cliente Stripe' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Create Stripe Checkout Session
  let checkoutSession: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>;
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { tenant_id: tenantId, plan_id: planId },
      },
      success_url: `${appUrl}/settings?tab=billing&success=true`,
      cancel_url: `${appUrl}/settings?tab=billing&canceled=true`,
      metadata: { tenant_id: tenantId },
    });
  } catch (err) {
    console.error('[billing/checkout] Stripe session creation failed:', err);
    return NextResponse.json({ error: 'Errore nella creazione della sessione di pagamento' }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
}
