-- ============================================
-- Stripe billing columns on tenants
-- ============================================
-- Tracks the Stripe customer, subscription, and status for each tenant.
-- plan_id FK already exists (migration 029); Stripe webhook updates it.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_stripe_customer
  ON tenants(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_stripe_subscription
  ON tenants(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Recreate the tenant_plan_limits view with stripe columns.
-- Must DROP first because CREATE OR REPLACE cannot reorder columns.
DROP VIEW IF EXISTS tenant_plan_limits;
CREATE VIEW tenant_plan_limits AS
SELECT
    t.id                          AS tenant_id,
    t.name                        AS tenant_name,
    t.plan_id,
    t.stripe_customer_id,
    t.stripe_subscription_id,
    t.stripe_subscription_status,
    t.trial_ends_at,
    p.name                        AS plan_name,
    p.price_eur_cents             AS plan_price_eur_cents,
    p.stripe_price_id             AS plan_stripe_price_id,
    p.max_sites                   AS plan_max_sites,
    p.max_team_members            AS plan_max_team_members,
    p.retention_days              AS plan_retention_days,
    p.uptime_check_min_minutes    AS plan_uptime_check_min_minutes,
    p.features                    AS plan_features,
    COALESCE(p.max_sites, t.max_sites) AS effective_max_sites
FROM tenants t
LEFT JOIN plans p ON p.id = t.plan_id;
