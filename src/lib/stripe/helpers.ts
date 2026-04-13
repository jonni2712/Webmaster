import { stripe } from './client';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Get or create a Stripe customer for the given tenant.
 * Uses the tenant's stripe_customer_id if it exists, otherwise creates one.
 */
export async function getOrCreateStripeCustomer(tenantId: string): Promise<string> {
  const supabase = createAdminClient();

  // Check if tenant already has a Stripe customer
  const { data: tenant } = await supabase
    .from('tenants')
    .select('stripe_customer_id, name')
    .eq('id', tenantId)
    .single();

  if (tenant?.stripe_customer_id) {
    return tenant.stripe_customer_id;
  }

  // Get the owner's email for the Stripe customer
  const { data: ownerRelation } = await supabase
    .from('user_tenants')
    .select('user_id')
    .eq('tenant_id', tenantId)
    .eq('role', 'owner')
    .single();

  let email: string | undefined;
  if (ownerRelation) {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', ownerRelation.user_id)
      .single();
    email = user?.email ?? undefined;
  }

  // Create Stripe customer
  const customer = await stripe.customers.create({
    name: tenant?.name || undefined,
    email,
    metadata: {
      tenant_id: tenantId,
    },
  });

  // Save the customer ID to the tenant
  await supabase
    .from('tenants')
    .update({ stripe_customer_id: customer.id })
    .eq('id', tenantId);

  return customer.id;
}

/**
 * Maps a Stripe Price ID to the internal plan ID.
 * Reads from the plans table (cached in plans.ts).
 */
export async function stripePriceToPlanId(priceId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('plans')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single();
  return data?.id ?? null;
}

/**
 * Updates the tenant's plan and subscription status based on Stripe data.
 */
export async function syncSubscriptionToTenant(
  subscriptionId: string,
  customerId: string,
  status: string,
  priceId: string | null,
  trialEnd: number | null,
): Promise<void> {
  const supabase = createAdminClient();

  // Find tenant by stripe_customer_id
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!tenant) {
    console.error(`[stripe] No tenant found for customer ${customerId}`);
    return;
  }

  const updates: Record<string, unknown> = {
    stripe_subscription_id: subscriptionId,
    stripe_subscription_status: status,
    trial_ends_at: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
  };

  // Map price to plan_id and update
  if (priceId) {
    const planId = await stripePriceToPlanId(priceId);
    if (planId) {
      updates.plan_id = planId;
      updates.plan = planId; // Keep legacy column in sync
    }
  }

  // If subscription is canceled or unpaid, downgrade to free
  if (status === 'canceled' || status === 'unpaid') {
    updates.plan_id = 'free';
    updates.plan = 'free';
    updates.stripe_subscription_id = null;
    updates.stripe_subscription_status = null;
  }

  await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenant.id);
}
