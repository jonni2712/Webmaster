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

  if (!planId || !PAID_PLANS.includes(planId as PlanId)) {
    return NextResponse.json(
      { error: 'Piano non valido. Scegli tra: pro, business, agency' },
      { status: 400 }
    );
  }

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

  // Check if tenant already has an active Stripe subscription
  const { data: tenant } = await supabase
    .from('tenants')
    .select('stripe_customer_id, stripe_subscription_id, stripe_subscription_status, plan_id')
    .eq('id', tenantId)
    .single();

  // ── If tenant has an active subscription, UPDATE it (plan change) instead of creating a new one ──
  if (
    tenant?.stripe_subscription_id &&
    tenant.stripe_subscription_status &&
    ['active', 'trialing', 'past_due'].includes(tenant.stripe_subscription_status)
  ) {
    // Don't allow "upgrading" to the same plan
    if (tenant.plan_id === planId) {
      return NextResponse.json(
        { error: 'Sei gia\' su questo piano' },
        { status: 400 }
      );
    }

    const plan = await getPlan(planId as PlanId);
    if (!plan?.stripePriceId) {
      return NextResponse.json({ error: 'Prezzo Stripe non configurato' }, { status: 500 });
    }

    try {
      // Get current subscription to find the item ID
      const sub = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id);
      const itemId = sub.items.data[0]?.id;

      if (!itemId) {
        return NextResponse.json({ error: 'Subscription item non trovato' }, { status: 500 });
      }

      // Update the subscription (prorate by default)
      await stripe.subscriptions.update(tenant.stripe_subscription_id, {
        items: [{ id: itemId, price: plan.stripePriceId }],
        proration_behavior: 'create_prorations',
        metadata: { tenant_id: tenantId, plan_id: planId },
      });

      // The webhook will handle updating the DB when Stripe confirms

      return NextResponse.json({ updated: true, planId }, { status: 200 });
    } catch (err) {
      console.error('[billing/checkout] Subscription update failed:', err);
      return NextResponse.json({ error: 'Errore nell\'aggiornamento del piano' }, { status: 500 });
    }
  }

  // ── No active subscription — create a new Checkout Session ──
  const plan = await getPlan(planId as PlanId);
  if (!plan?.stripePriceId) {
    return NextResponse.json({ error: 'Prezzo Stripe non configurato' }, { status: 500 });
  }

  let customerId: string;
  try {
    customerId = await getOrCreateStripeCustomer(tenantId);
  } catch (err) {
    console.error('[billing/checkout] Failed to get/create Stripe customer:', err);
    return NextResponse.json({ error: 'Errore nella creazione del cliente Stripe' }, { status: 500 });
  }

  // Check if this customer has ever had a subscription (prevent trial abuse)
  const existingSubs = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
    status: 'all', // includes canceled
  });
  const hadPreviousSub = existingSubs.data.length > 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://webmaster-monitor.it';

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      subscription_data: {
        // Only give trial if this is truly a first-time subscriber
        ...(hadPreviousSub ? {} : { trial_period_days: 14 }),
        metadata: { tenant_id: tenantId, plan_id: planId },
      },
      // Prevent duplicate customers from being created
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      success_url: `${appUrl}/settings?tab=billing&success=true`,
      cancel_url: `${appUrl}/settings?tab=billing&canceled=true`,
      metadata: { tenant_id: tenantId },
    });

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (err) {
    console.error('[billing/checkout] Stripe session creation failed:', err);
    return NextResponse.json({ error: 'Errore nella creazione della sessione di pagamento' }, { status: 500 });
  }
}
