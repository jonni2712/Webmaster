import { createAdminClient } from '@/lib/supabase/admin';
import { getPlanForTenant } from './plans';

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
 * Error thrown when a tenant tries to add a site beyond their plan limit.
 * API routes should catch this and return 403 with the payload below.
 */
export class PlanLimitError extends Error {
  constructor(
    public readonly kind: 'max_sites',
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
