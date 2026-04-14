import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { syncSubscriptionToTenant } from '@/lib/stripe/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  sendUpgradeEmail,
  sendCancellationEmail,
  sendPaymentFailedEmail,
} from '@/lib/email/billing-emails';
import type Stripe from 'stripe';

async function getTenantOwnerEmail(tenantId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('user_tenants')
    .select('users(email)')
    .eq('tenant_id', tenantId)
    .eq('role', 'owner')
    .single();
  return (data?.users as { email?: string } | null)?.email ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.text(); // RAW text — required for Stripe signature verification
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[stripe webhook] Signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  console.log(`[stripe webhook] Processing event ${event.id} (${event.type})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        if (checkoutSession.mode !== 'subscription') break;

        const subscriptionId = checkoutSession.subscription as string | null;
        const customerId = checkoutSession.customer as string | null;

        if (!subscriptionId || !customerId) {
          console.error('[stripe webhook] checkout.session.completed missing subscription or customer');
          break;
        }

        // Retrieve the subscription to get full details (price, status, trial)
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id ?? null;

        await syncSubscriptionToTenant(
          subscriptionId,
          customerId,
          subscription.status,
          priceId,
          subscription.trial_end,
        );

        console.log(`[stripe webhook] checkout.session.completed: synced subscription ${subscriptionId} for customer ${customerId}`);

        // Send upgrade confirmation email
        try {
          const supabase = createAdminClient();
          const { data: tenant } = await supabase
            .from('tenants')
            .select('id, plan_id')
            .eq('stripe_customer_id', customerId)
            .single();
          if (tenant) {
            const email = await getTenantOwnerEmail(tenant.id);
            if (email) {
              await sendUpgradeEmail(email, tenant.plan_id ?? 'Pro');
            }
          }
        } catch (emailErr) {
          console.error('[stripe webhook] checkout.session.completed: failed to send upgrade email', emailErr);
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id ?? null;

        await syncSubscriptionToTenant(
          subscription.id,
          customerId,
          subscription.status,
          priceId,
          subscription.trial_end,
        );

        console.log(`[stripe webhook] customer.subscription.updated: synced subscription ${subscription.id} status=${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const supabase = createAdminClient();

        // Find tenant by stripe_customer_id
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!tenant) {
          console.error(`[stripe webhook] customer.subscription.deleted: no tenant found for customer ${customerId}`);
          break;
        }

        // Downgrade to free and clear subscription data
        await supabase
          .from('tenants')
          .update({
            plan_id: 'free',
            plan: 'free',
            stripe_subscription_id: null,
            stripe_subscription_status: null,
          })
          .eq('id', tenant.id);

        console.log(`[stripe webhook] customer.subscription.deleted: tenant ${tenant.id} downgraded to free`);

        // Send cancellation confirmation email
        try {
          const email = await getTenantOwnerEmail(tenant.id);
          if (email) {
            await sendCancellationEmail(email);
          }
        } catch (emailErr) {
          console.error('[stripe webhook] customer.subscription.deleted: failed to send cancellation email', emailErr);
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? '';
        const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string'
          ? invoice.parent.subscription_details.subscription
          : null;

        console.warn(`[stripe webhook] invoice.payment_failed: customer=${customerId} subscription=${subscriptionId ?? 'none'}`);

        if (subscriptionId && customerId) {
          const supabase = createAdminClient();

          // Find tenant by stripe_customer_id
          const { data: tenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (tenant) {
            await supabase
              .from('tenants')
              .update({ stripe_subscription_status: 'past_due' })
              .eq('id', tenant.id);

            console.log(`[stripe webhook] invoice.payment_failed: tenant ${tenant.id} marked as past_due`);

            // Send payment failed notification email
            try {
              const email = await getTenantOwnerEmail(tenant.id);
              if (email) {
                await sendPaymentFailedEmail(email);
              }
            } catch (emailErr) {
              console.error('[stripe webhook] invoice.payment_failed: failed to send payment failed email', emailErr);
            }
          }
        }
        break;
      }

      default:
        // Return 200 for unhandled events — Stripe retries on non-2xx
        console.log(`[stripe webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[stripe webhook] Error handling event ${event.type}:`, err);
    // Still return 200 to prevent Stripe from retrying on application errors
    return new Response('Webhook handler error', { status: 200 });
  }

  return new Response('OK', { status: 200 });
}
