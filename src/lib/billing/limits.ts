import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanForTenant, tenantHasFeature, tenantCanUseChannel } from './plans';

/**
 * Plan limit enforcement helpers.
 *
 * Reads plan limits via `getPlanForTenant()` from the `plans` table.
 * Falls back to `tenants.max_sites` column if the tenant has no plan_id
 * assigned yet (shouldn't happen post-migration-029, but defensive).
 */

export interface SiteLimitStatus {
  current: number;
  max: number;
  canAdd: boolean;
  /** Rows of headroom left before hitting the limit. Negative if already over. */
  remaining: number;
}

/**
 * Returns how many sites a tenant currently has vs. how many they are
 * allowed to have. Does NOT throw; safe for read-only UI badges.
 */
export async function getSiteLimitStatus(
  tenantId: string
): Promise<SiteLimitStatus> {
  const supabase = createAdminClient();

  const [planResult, siteCountResult] = await Promise.all([
    getPlanForTenant(tenantId),
    supabase
      .from('sites')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      // Don't count subsites — they inherit from their parent and
      // shouldn't eat into the tenant's quota.
      .is('parent_site_id', null),
  ]);

  const max = planResult?.maxSites ?? 0;
  const current = siteCountResult.count ?? 0;

  return {
    current,
    max,
    canAdd: current < max,
    remaining: max - current,
  };
}

/**
 * Error thrown when a tenant exceeds a plan limit or lacks a required feature.
 * API routes should catch this and return 403 with the payload below.
 *
 * `kind` can be any limit identifier: 'max_sites', 'max_team_members',
 * 'scanner', 'agent', 'api', 'channel', etc.
 */
export class PlanLimitError extends Error {
  constructor(
    public readonly kind: string,
    public readonly current: number,
    public readonly max: number
  ) {
    super(`Plan limit reached: ${kind} ${current}/${max}`);
    this.name = 'PlanLimitError';
  }
}

/**
 * Throws PlanLimitError if the tenant cannot add another site.
 * Call this at the top of POST /api/sites before any insert.
 */
export async function assertCanAddSite(tenantId: string): Promise<void> {
  const status = await getSiteLimitStatus(tenantId);
  if (!status.canAdd) {
    throw new PlanLimitError('max_sites', status.current, status.max);
  }
}

/**
 * Throws PlanLimitError if the tenant has reached their team member limit.
 * Call this before creating a team invitation or adding a member directly.
 */
export async function assertCanAddTeamMember(tenantId: string): Promise<void> {
  const plan = await getPlanForTenant(tenantId);
  if (!plan) throw new PlanLimitError('max_team_members', 0, 0);

  const supabase = createAdminClient();
  const { count } = await supabase
    .from('user_tenants')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  const current = count ?? 0;
  if (current >= plan.maxTeamMembers) {
    throw new PlanLimitError('max_team_members', current, plan.maxTeamMembers);
  }
}

/**
 * Validates that the requested check interval is allowed by the plan.
 * Returns the clamped interval (never below the plan minimum).
 * Safe to call on create and update — never throws.
 */
export async function clampCheckInterval(
  tenantId: string,
  requestedMinutes: number
): Promise<number> {
  const plan = await getPlanForTenant(tenantId);
  const minAllowed = plan?.uptimeCheckMinMinutes ?? 15;
  return Math.max(requestedMinutes, minAllowed);
}

/**
 * Throws PlanLimitError if the tenant's plan does not include the given feature.
 * @param feature - 'scanner' | 'agent' | 'api'
 */
export async function assertHasFeature(
  tenantId: string,
  feature: 'scanner' | 'agent' | 'api'
): Promise<void> {
  const hasIt = await tenantHasFeature(tenantId, feature);
  if (!hasIt) {
    throw new PlanLimitError(feature, 0, 0);
  }
}

/**
 * Throws PlanLimitError if the tenant's plan does not allow the given
 * notification channel (e.g. 'slack', 'telegram', 'discord', 'webhook').
 */
export async function assertCanUseChannel(
  tenantId: string,
  channel: string
): Promise<void> {
  const canUse = await tenantCanUseChannel(tenantId, channel as any);
  if (!canUse) {
    throw new PlanLimitError('channel', 0, 0);
  }
}
