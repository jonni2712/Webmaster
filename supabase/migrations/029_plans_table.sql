-- ============================================
-- Plans table — centralized plan definitions
-- ============================================
-- Single source of truth for every plan limit used across:
--   • Register / OAuth signup default (max_sites, retention_days)
--   • Site creation enforcement (assertCanAddSite)
--   • Retention cleanup cron (per-plan TTL)
--   • Stripe webhook handler (plan_id ↔ stripe_price_id mapping)
--   • Landing page pricing cards (marketing copy)
--
-- The existing `tenants.plan` VARCHAR column is kept as a backward-compat
-- alias during the migration; the new `plan_id` FK column is the canonical
-- reference going forward. Both are updated in sync.

CREATE TABLE IF NOT EXISTS plans (
    -- Short stable ID used in code and URLs: 'free', 'pro', 'enterprise'
    id VARCHAR(50) PRIMARY KEY,

    -- Human-readable name shown on landing and settings UI
    name VARCHAR(100) NOT NULL,

    -- Monthly price in EUR cents. 0 for free tier.
    price_eur_cents INTEGER NOT NULL DEFAULT 0,

    -- Stripe Price ID, populated during Phase 2.1 (Stripe product setup).
    -- NULL until Stripe is wired.
    stripe_price_id VARCHAR(255),

    -- Hard quota on the number of top-level sites this plan allows.
    -- Subsites (parent_site_id IS NOT NULL) do NOT count against this.
    max_sites INTEGER NOT NULL,

    -- Hard quota on team members per tenant.
    max_team_members INTEGER NOT NULL DEFAULT 1,

    -- How many days to retain historical monitoring data
    -- (uptime_checks, ssl_checks, alerts, performance_checks, etc.)
    retention_days INTEGER NOT NULL,

    -- Minimum allowed uptime check interval in minutes — gates what users
    -- are allowed to set on their sites. Enforcement is added in Phase 2.5.
    uptime_check_min_minutes INTEGER NOT NULL DEFAULT 15,

    -- Free-form feature flag bag. Keys are implementation-defined; the
    -- `plans.ts` helper library exposes typed getters.
    -- Examples: channels (array), scanner (bool), agent (bool), api (bool)
    features JSONB NOT NULL DEFAULT '{}',

    -- Display order on the landing page (1 = leftmost)
    sort_order INTEGER NOT NULL DEFAULT 0,

    -- Soft disable for a plan without deleting it (e.g. legacy plan
    -- grandfathered to existing customers but hidden from the landing).
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);

-- Auto-update updated_at trigger (reuse the existing helper function)
CREATE TRIGGER tr_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: anyone can read the list of active plans (needed by the landing),
-- only service role can modify them.
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans" ON plans
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Service role can manage plans" ON plans
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Seed data
-- ============================================
-- Aligned with IMPLEMENTATION_PLAN.md Phase 1.1 and with the landing page
-- post-honesty-pass copy. Keep this block in sync with `src/app/page.tsx`.

INSERT INTO plans (id, name, price_eur_cents, max_sites, max_team_members, retention_days, uptime_check_min_minutes, features, sort_order) VALUES
(
    'free',
    'Free',
    0,
    3,
    1,
    7,
    15,
    '{"channels": ["email"], "scanner": false, "agent": false, "api": false, "support": "community"}'::jsonb,
    1
),
(
    'pro',
    'Pro',
    2900,
    25,
    3,
    30,
    5,
    '{"channels": ["email", "slack", "telegram", "discord", "webhook"], "scanner": true, "agent": false, "api": false, "support": "priority"}'::jsonb,
    2
),
(
    'enterprise',
    'Enterprise',
    7900,
    10000,
    50,
    365,
    5,
    '{"channels": ["email", "slack", "telegram", "discord", "webhook"], "scanner": true, "agent": true, "api": true, "support": "account_manager"}'::jsonb,
    3
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Add plan_id FK to tenants
-- ============================================
-- The legacy `tenants.plan` column stays for now (NextAuth session code
-- and some type defs still read it). We'll drop it in a future migration
-- once all reads have been migrated to plan_id.

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50)
    REFERENCES plans(id) ON DELETE RESTRICT;

-- Backfill plan_id from the legacy enum column for existing tenants.
UPDATE tenants SET plan_id = plan WHERE plan_id IS NULL AND plan IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_plan_id ON tenants(plan_id);

-- ============================================
-- Convenience view for Phase 2 Stripe webhooks
-- ============================================
-- Returns the fully joined tenant + plan limits in one query so that
-- getPlanFor(tenantId) is a single round trip.

CREATE OR REPLACE VIEW tenant_plan_limits AS
SELECT
    t.id                          AS tenant_id,
    t.name                        AS tenant_name,
    t.plan_id,
    p.name                        AS plan_name,
    p.price_eur_cents             AS plan_price_eur_cents,
    p.max_sites                   AS plan_max_sites,
    p.max_team_members            AS plan_max_team_members,
    p.retention_days              AS plan_retention_days,
    p.uptime_check_min_minutes    AS plan_uptime_check_min_minutes,
    p.features                    AS plan_features,
    -- Fall back to the per-tenant override column if plan_id is somehow
    -- unset (e.g. old rows before the backfill ran).
    COALESCE(p.max_sites, t.max_sites) AS effective_max_sites
FROM tenants t
LEFT JOIN plans p ON p.id = t.plan_id;
