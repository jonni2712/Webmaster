-- ============================================
-- Update plans to new 4-tier structure
-- ============================================
-- Starter (free) → Pro → Business (new) → Agency
-- Based on cost analysis: infra cost ~€0.02/site/month
-- All margins > 95%

-- Update Free → Starter: expand from 3 to 5 sites
UPDATE plans SET
    name = 'Starter',
    max_sites = 5,
    updated_at = NOW()
WHERE id = 'free';

-- Update Pro: lower price from €29 to €19, expand to 30 sites
UPDATE plans SET
    name = 'Pro',
    price_eur_cents = 1900,
    max_sites = 30,
    max_team_members = 5,
    retention_days = 30,
    uptime_check_min_minutes = 5,
    features = '{"channels": ["email", "slack", "telegram", "discord", "webhook"], "scanner": true, "agent": false, "api": false, "support": "priority"}'::jsonb,
    updated_at = NOW()
WHERE id = 'pro';

-- Insert new Business tier
INSERT INTO plans (id, name, price_eur_cents, max_sites, max_team_members, retention_days, uptime_check_min_minutes, features, sort_order)
VALUES (
    'business',
    'Business',
    4900,
    100,
    10,
    90,
    3,
    '{"channels": ["email", "slack", "telegram", "discord", "webhook"], "scanner": true, "agent": false, "api": true, "support": "priority"}'::jsonb,
    3
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_eur_cents = EXCLUDED.price_eur_cents,
    max_sites = EXCLUDED.max_sites,
    max_team_members = EXCLUDED.max_team_members,
    retention_days = EXCLUDED.retention_days,
    uptime_check_min_minutes = EXCLUDED.uptime_check_min_minutes,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- ============================================
-- Replace Enterprise with Agency
-- ============================================
-- We cannot rename a primary key value while FK constraints exist on
-- tenants.plan_id. Instead: insert Agency as a new row, migrate all
-- tenant references, then soft-deactivate Enterprise so history is
-- preserved for any existing audit/billing records.

-- Insert Agency as new plan (sort_order = 4, after Business)
INSERT INTO plans (id, name, price_eur_cents, max_sites, max_team_members, retention_days, uptime_check_min_minutes, features, sort_order)
VALUES (
    'agency',
    'Agency',
    12900,
    300,
    50,
    365,
    1,
    '{"channels": ["email", "slack", "telegram", "discord", "webhook"], "scanner": true, "agent": true, "api": true, "support": "account_manager"}'::jsonb,
    4
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_eur_cents = EXCLUDED.price_eur_cents,
    max_sites = EXCLUDED.max_sites,
    max_team_members = EXCLUDED.max_team_members,
    retention_days = EXCLUDED.retention_days,
    uptime_check_min_minutes = EXCLUDED.uptime_check_min_minutes,
    features = EXCLUDED.features,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- Drop the legacy CHECK constraint that only allows free/pro/enterprise,
-- then re-create it with the new plan IDs including business and agency.
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_plan_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_plan_check
    CHECK (plan IN ('free', 'pro', 'business', 'agency', 'enterprise'));

-- Migrate tenants from enterprise to agency (FK column first, then legacy column)
UPDATE tenants SET plan_id = 'agency' WHERE plan_id = 'enterprise';
UPDATE tenants SET plan = 'agency' WHERE plan = 'enterprise';

-- Soft-deactivate enterprise — do NOT delete, preserves billing history
UPDATE plans SET is_active = FALSE, updated_at = NOW() WHERE id = 'enterprise';
