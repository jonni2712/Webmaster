import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanForTenant } from '@/lib/billing/plans';

export async function GET(request: NextRequest) {
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

  // Get plan for tenant (includes limits)
  const plan = await getPlanForTenant(tenantId);
  if (!plan) {
    return NextResponse.json({ error: 'Piano non trovato' }, { status: 404 });
  }

  // Get subscription data from tenant row
  const { data: tenant } = await supabase
    .from('tenants')
    .select('stripe_subscription_id, stripe_subscription_status, trial_ends_at')
    .eq('id', tenantId)
    .single();

  // Get current site count
  const { count: siteCount } = await supabase
    .from('sites')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  // Get current team member count
  const { count: memberCount } = await supabase
    .from('user_tenants')
    .select('user_id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  return NextResponse.json({
    plan: {
      id: plan.id,
      name: plan.name,
      priceEurCents: plan.priceEurCents,
      maxSites: plan.maxSites,
      maxTeamMembers: plan.maxTeamMembers,
      retentionDays: plan.retentionDays,
      uptimeCheckMinMinutes: plan.uptimeCheckMinMinutes,
      features: plan.features,
    },
    subscription: {
      status: (tenant?.stripe_subscription_status as 'active' | 'trialing' | 'past_due' | null) ?? null,
      trialEndsAt: tenant?.trial_ends_at ?? null,
      stripeSubscriptionId: tenant?.stripe_subscription_id ?? null,
    },
    usage: {
      sites: {
        current: siteCount ?? 0,
        max: plan.maxSites,
      },
      teamMembers: {
        current: memberCount ?? 0,
        max: plan.maxTeamMembers,
      },
    },
  });
}
