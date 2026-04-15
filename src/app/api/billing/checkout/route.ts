import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { getOrCreateStripeCustomer } from '@/lib/stripe/helpers';
import { getPlan } from '@/lib/billing/plans';
import type { PlanId } from '@/lib/billing/plans';
import type Stripe from 'stripe';

const PAID_PLANS: PlanId[] = ['pro', 'business', 'agency'];

// Annual Stripe price IDs (created by scripts/stripe-setup-products.mjs).
// Monthly prices live in the DB (plans.stripe_price_id).
const ANNUAL_PRICE_IDS: Record<string, string> = {
  pro: 'price_1TLgsWRvnkGxlG3g0bHlCxbh',       // €180/year
  business: 'price_1TLgsXRvnkGxlG3gXOta0jwv',  // €492/year
  agency: 'price_1TLgsXRvnkGxlG3gZEwvfBTd',    // €1308/year
};

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

    // Use annual price if requested, otherwise monthly
    const targetPriceId = annual ? ANNUAL_PRICE_IDS[planId] : plan.stripePriceId;
    if (annual && !targetPriceId) {
      return NextResponse.json({ error: 'Prezzo annuale non disponibile' }, { status: 500 });
    }

    try {
      // Get current subscription to find the item ID
      const sub = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id);
      const itemId = sub.items.data[0]?.id;

      if (!itemId) {
        return NextResponse.json({ error: 'Subscription item non trovato' }, { status: 500 });
      }

      // Update the subscription (prorate by default)
      // Propaghiamo i metadati di fatturazione centralizzata anche su upgrade,
      // così invoice.paid del ciclo prorazionale genera FatturaPA.
      // customer_type/fiscal_profile sono AUTO-DETECT dal backend billing:
      // P.IVA presente → business, solo CF → private, niente → receipt-only.
      await stripe.subscriptions.update(tenant.stripe_subscription_id, {
        items: [{ id: itemId, price: targetPriceId }],
        proration_behavior: 'create_prorations',
        metadata: {
          tenant_id: tenantId,
          plan_id: planId,
          project_code: 'WEBMASTER-MONITOR',
          source_app: 'webmaster-monitor.it',
          order_reference: `WM-${tenantId}-${planId}-${annual ? 'yr' : 'mo'}-upgrade-${Date.now()}`,
        },
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

  // Use annual price if requested, otherwise monthly (from DB)
  const stripePriceId = annual ? ANNUAL_PRICE_IDS[planId] : plan.stripePriceId;
  if (annual && !stripePriceId) {
    return NextResponse.json({ error: 'Prezzo annuale non disponibile' }, { status: 500 });
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

  // Pre-compila dati fiscali noti dal Customer Stripe per evitare
  // che il cliente li reinserisca ad ogni checkout.
  // Fonti: customer.name (ragione sociale), customer.tax_ids[] (P.IVA),
  //        customer.metadata.sdi_code, customer.metadata.pec_email.
  let prefilledFiscal: {
    legal_name?: string;
    vat_number?: string;
    tax_code?: string;
    sdi_code?: string;
    pec_email?: string;
  } = {};
  try {
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['tax_ids'],
    });
    if (customer && !customer.deleted) {
      const euVat = (customer.tax_ids?.data || []).find(
        (t) => t.type === 'eu_vat'
      );
      prefilledFiscal = {
        ...(customer.name ? { legal_name: customer.name } : {}),
        ...(euVat?.value ? { vat_number: String(euVat.value).replace(/^IT/i, '') } : {}),
        ...(customer.metadata?.tax_code ? { tax_code: customer.metadata.tax_code } : {}),
        ...(customer.metadata?.sdi_code ? { sdi_code: customer.metadata.sdi_code } : {}),
        ...(customer.metadata?.pec_email ? { pec_email: customer.metadata.pec_email } : {}),
      };
    }
  } catch (err) {
    console.warn('[billing/checkout] prefill fiscal data failed (non-fatal):', err);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://webmaster-monitor.it';

  // ── Metadata per fatturazione centralizzata (billings.i-creativi.it) ──
  // Il backend di fatturazione riceve gli stessi webhook Stripe e genera
  // la FatturaPA automaticamente usando questi metadata.
  // Il nostro webhook /api/webhooks/stripe resta indipendente (gestisce DB interno).
  const billingMetadata: Record<string, string> = {
    project_code: 'WEBMASTER-MONITOR',
    source_app: 'webmaster-monitor.it',
    order_reference: `WM-${tenantId}-${planId}-${annual ? 'yr' : 'mo'}-${Date.now()}`,
    // customer_type è auto-detect dal backend billing:
    //   - P.IVA tax_id compilata  → business
    //   - solo CF compilato       → private
    //   - entrambi vuoti          → private
    ...prefilledFiscal, // legal_name / vat_number / tax_code / sdi_code / pec_email dal Customer Stripe
  };

  // Custom fields Stripe (max 3). Mostrati solo se i dati NON sono già
  // noti dal Customer — per i clienti ricorrenti il form è più pulito.
  type CustomField = NonNullable<Stripe.Checkout.SessionCreateParams['custom_fields']>[number];
  const customFields: CustomField[] = [];
  if (!prefilledFiscal.tax_code) {
    customFields.push({
      key: 'tax_code',
      label: { type: 'custom', custom: 'Codice Fiscale (se privato)' },
      type: 'text',
      optional: true,
      text: { minimum_length: 11, maximum_length: 16 },
    });
  }
  if (!prefilledFiscal.sdi_code) {
    customFields.push({
      key: 'sdi_code',
      label: { type: 'custom', custom: 'Codice SDI (se azienda)' },
      type: 'text',
      optional: true,
      text: { minimum_length: 6, maximum_length: 7 },
    });
  }
  if (!prefilledFiscal.pec_email) {
    customFields.push({
      key: 'pec_email',
      label: { type: 'custom', custom: 'PEC fattura (se azienda)' },
      type: 'text',
      optional: true,
    });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      subscription_data: {
        // Only give trial if this is truly a first-time subscriber
        ...(hadPreviousSub ? {} : { trial_period_days: 14 }),
        metadata: { tenant_id: tenantId, plan_id: planId, ...billingMetadata },
      },
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
      ...(customFields.length > 0 ? { custom_fields: customFields } : {}),
      allow_promotion_codes: true,
      success_url: `${appUrl}/settings?tab=billing&success=true`,
      cancel_url: `${appUrl}/settings?tab=billing&canceled=true`,
      metadata: { tenant_id: tenantId, ...billingMetadata },
    });

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (err) {
    console.error('[billing/checkout] Stripe session creation failed:', err);
    return NextResponse.json({ error: 'Errore nella creazione della sessione di pagamento' }, { status: 500 });
  }
}
