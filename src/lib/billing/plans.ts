import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Typed wrappers around the `plans` and `tenant_plan_limits` tables.
 *
 * Use this module as the single source of truth for plan limits across
 * the app. Never read `tenants.plan` or `tenants.max_sites` directly —
 * always go through `getPlanForTenant()` or `getPlan()` so we can swap
 * the storage layer (or add caching) in one place.
 */

// ---------- Types ----------

export type PlanId = 'free' | 'pro' | 'business' | 'agency';

export type NotificationChannel =
  | 'email'
  | 'slack'
  | 'telegram'
  | 'discord'
  | 'webhook';

export type SupportLevel = 'community' | 'priority' | 'account_manager';

export interface PlanFeatures {
  /** Allowed notification channels. */
  channels: NotificationChannel[];
  /** Access to DNS/SSL/CMS/WHOIS scanner. */
  scanner: boolean;
  /** Access to cPanel/Plesk agent integration. */
  agent: boolean;
  /** Access to public REST API. */
  api: boolean;
  /** Support tier. */
  support: SupportLevel;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceEurCents: number;
  stripePriceId: string | null;
  maxSites: number;
  maxTeamMembers: number;
  retentionDays: number;
  uptimeCheckMinMinutes: number;
  features: PlanFeatures;
  sortOrder: number;
  isActive: boolean;
}

export interface TenantPlanLimits extends Plan {
  tenantId: string;
  tenantName: string;
}

// ---------- Cache ----------

// Plans don't change often. Cache them in-memory for the lifetime of
// the serverless function instance (Fluid Compute reuses instances, so
// this is a real win for hot paths like POST /api/sites).
const PLAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let planCache: { data: Plan[]; expiresAt: number } | null = null;

function invalidatePlanCache() {
  planCache = null;
}

// ---------- Row-to-object mappers ----------

interface PlanRow {
  id: string;
  name: string;
  price_eur_cents: number;
  stripe_price_id: string | null;
  max_sites: number;
  max_team_members: number;
  retention_days: number;
  uptime_check_min_minutes: number;
  features: unknown;
  sort_order: number;
  is_active: boolean;
}

function parseFeatures(raw: unknown): PlanFeatures {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    channels: Array.isArray(obj.channels)
      ? (obj.channels as NotificationChannel[])
      : ['email'],
    scanner: obj.scanner === true,
    agent: obj.agent === true,
    api: obj.api === true,
    support: (obj.support as SupportLevel) || 'community',
  };
}

function rowToPlan(row: PlanRow): Plan {
  return {
    id: row.id as PlanId,
    name: row.name,
    priceEurCents: row.price_eur_cents,
    stripePriceId: row.stripe_price_id,
    maxSites: row.max_sites,
    maxTeamMembers: row.max_team_members,
    retentionDays: row.retention_days,
    uptimeCheckMinMinutes: row.uptime_check_min_minutes,
    features: parseFeatures(row.features),
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

// ---------- Public API ----------

/**
 * Returns all active plans, sorted for display (Free → Pro → Enterprise).
 * Result is cached in-memory for 5 minutes.
 */
export async function getAllPlans(): Promise<Plan[]> {
  if (planCache && planCache.expiresAt > Date.now()) {
    return planCache.data;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[plans] Failed to fetch plans:', error);
    throw new Error(`Failed to load plans: ${error.message}`);
  }

  const plans = (data as PlanRow[]).map(rowToPlan);
  planCache = {
    data: plans,
    expiresAt: Date.now() + PLAN_CACHE_TTL_MS,
  };
  return plans;
}

/**
 * Fetches a single plan by ID. Uses the cached list when possible.
 */
export async function getPlan(id: PlanId | string): Promise<Plan | null> {
  const plans = await getAllPlans();
  return plans.find((p) => p.id === id) ?? null;
}

/**
 * Returns the effective plan + limits for a specific tenant.
 * Uses the `tenant_plan_limits` view to get everything in one query.
 */
export async function getPlanForTenant(
  tenantId: string
): Promise<TenantPlanLimits | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('tenant_plan_limits')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    if (error?.code !== 'PGRST116') {
      console.error('[plans] getPlanForTenant failed:', error);
    }
    return null;
  }

  const row = data as Record<string, unknown>;

  return {
    tenantId: row.tenant_id as string,
    tenantName: row.tenant_name as string,
    id: (row.plan_id as PlanId) ?? 'free',
    name: (row.plan_name as string) ?? 'Free',
    priceEurCents: (row.plan_price_eur_cents as number) ?? 0,
    stripePriceId: null, // not exposed by the view; use getPlan() if needed
    maxSites: (row.effective_max_sites as number) ?? 0,
    maxTeamMembers: (row.plan_max_team_members as number) ?? 1,
    retentionDays: (row.plan_retention_days as number) ?? 7,
    uptimeCheckMinMinutes: (row.plan_uptime_check_min_minutes as number) ?? 15,
    features: parseFeatures(row.plan_features),
    sortOrder: 0,
    isActive: true,
  };
}

/**
 * Convenience: does the tenant's plan allow the given feature?
 */
export async function tenantHasFeature(
  tenantId: string,
  feature: 'scanner' | 'agent' | 'api'
): Promise<boolean> {
  const plan = await getPlanForTenant(tenantId);
  return plan?.features[feature] === true;
}

/**
 * Convenience: is the given channel allowed on the tenant's plan?
 */
export async function tenantCanUseChannel(
  tenantId: string,
  channel: NotificationChannel
): Promise<boolean> {
  const plan = await getPlanForTenant(tenantId);
  return plan?.features.channels.includes(channel) ?? false;
}

/**
 * Exported for testing and for admin endpoints that mutate plans.
 */
export const _internal = {
  invalidatePlanCache,
};
