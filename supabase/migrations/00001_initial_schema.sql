-- ============================================
-- SCHEMA: Multi-tenant Website Monitoring
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS (per futura evoluzione SaaS)
-- ============================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    settings JSONB DEFAULT '{}',
    max_sites INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant di default per uso personale iniziale
INSERT INTO tenants (id, name, slug, plan, max_sites)
VALUES ('00000000-0000-0000-0000-000000000001', 'Personal', 'personal', 'enterprise', 1000);

-- ============================================
-- USERS (integrato con NextAuth)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    current_tenant_id UUID REFERENCES tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    email_verified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER_TENANTS (relazione N:N per multi-tenant)
-- ============================================
CREATE TABLE user_tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- ============================================
-- SITES (siti monitorati)
-- ============================================
CREATE TYPE platform_type AS ENUM ('wordpress', 'prestashop', 'other');

CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
    url VARCHAR(500) NOT NULL,
    name VARCHAR(255) NOT NULL,
    platform platform_type NOT NULL,

    -- Credenziali API (criptate a livello applicativo)
    api_endpoint TEXT,
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,

    -- Configurazione monitoraggio
    check_interval INTEGER DEFAULT 5,
    ssl_check_enabled BOOLEAN DEFAULT true,
    uptime_check_enabled BOOLEAN DEFAULT true,
    performance_check_enabled BOOLEAN DEFAULT true,
    updates_check_enabled BOOLEAN DEFAULT true,
    ecommerce_check_enabled BOOLEAN DEFAULT false,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    last_check_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, url)
);

CREATE INDEX idx_sites_tenant ON sites(tenant_id);
CREATE INDEX idx_sites_platform ON sites(platform);
CREATE INDEX idx_sites_active ON sites(is_active) WHERE is_active = true;

-- ============================================
-- UPTIME_CHECKS
-- ============================================
CREATE TABLE uptime_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    is_up BOOLEAN NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_type VARCHAR(100),
    error_message TEXT,
    checked_from VARCHAR(50) DEFAULT 'vercel-edge',
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uptime_site ON uptime_checks(site_id);
CREATE INDEX idx_uptime_date ON uptime_checks(checked_at DESC);
CREATE INDEX idx_uptime_down ON uptime_checks(site_id, checked_at) WHERE is_up = false;

-- ============================================
-- SSL_CHECKS
-- ============================================
CREATE TABLE ssl_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    is_valid BOOLEAN NOT NULL,
    valid_from TIMESTAMPTZ,
    valid_to TIMESTAMPTZ,
    days_until_expiry INTEGER,
    issuer VARCHAR(255),
    subject VARCHAR(255),
    serial_number VARCHAR(255),
    error_message TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ssl_checks_site ON ssl_checks(site_id);
CREATE INDEX idx_ssl_checks_date ON ssl_checks(checked_at DESC);
CREATE INDEX idx_ssl_expiring ON ssl_checks(days_until_expiry) WHERE days_until_expiry <= 30;

-- ============================================
-- PERFORMANCE_CHECKS
-- ============================================
CREATE TABLE performance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    lcp_ms INTEGER,
    fid_ms INTEGER,
    cls DECIMAL(5,3),
    fcp_ms INTEGER,
    ttfb_ms INTEGER,
    tti_ms INTEGER,
    tbt_ms INTEGER,
    speed_index INTEGER,
    performance_score INTEGER CHECK (performance_score BETWEEN 0 AND 100),
    total_bytes INTEGER,
    html_bytes INTEGER,
    css_bytes INTEGER,
    js_bytes INTEGER,
    image_bytes INTEGER,
    font_bytes INTEGER,
    total_requests INTEGER,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_perf_site ON performance_checks(site_id);
CREATE INDEX idx_perf_date ON performance_checks(checked_at DESC);

-- ============================================
-- WP_UPDATES
-- ============================================
CREATE TYPE update_type AS ENUM ('core', 'plugin', 'theme');
CREATE TYPE update_status AS ENUM ('available', 'applied', 'failed', 'ignored');

CREATE TABLE wp_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    update_type update_type NOT NULL,
    slug VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    current_version VARCHAR(50),
    new_version VARCHAR(50),
    is_critical BOOLEAN DEFAULT false,
    is_auto_update BOOLEAN DEFAULT false,
    status update_status DEFAULT 'available',
    applied_at TIMESTAMPTZ,
    changelog_url TEXT,
    requires_php VARCHAR(20),
    requires_wp VARCHAR(20),
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wp_updates_site ON wp_updates(site_id);
CREATE INDEX idx_wp_updates_available ON wp_updates(site_id, status) WHERE status = 'available';
CREATE UNIQUE INDEX idx_wp_updates_unique ON wp_updates(site_id, update_type, slug, new_version);

-- ============================================
-- PS_UPDATES
-- ============================================
CREATE TYPE ps_update_type AS ENUM ('core', 'module', 'theme');

CREATE TABLE ps_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    update_type ps_update_type NOT NULL,
    technical_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    current_version VARCHAR(50),
    new_version VARCHAR(50),
    is_critical BOOLEAN DEFAULT false,
    status update_status DEFAULT 'available',
    applied_at TIMESTAMPTZ,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ps_updates_site ON ps_updates(site_id);
CREATE INDEX idx_ps_updates_available ON ps_updates(site_id, status) WHERE status = 'available';

-- ============================================
-- ECOMMERCE_TRANSACTIONS
-- ============================================
CREATE TABLE ecommerce_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    order_count INTEGER DEFAULT 0,
    order_count_pending INTEGER DEFAULT 0,
    order_count_completed INTEGER DEFAULT 0,
    order_count_cancelled INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    products_sold INTEGER DEFAULT 0,
    unique_customers INTEGER DEFAULT 0,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ecommerce_site ON ecommerce_transactions(site_id);
CREATE INDEX idx_ecommerce_period ON ecommerce_transactions(period_start, period_end);

-- ============================================
-- ALERT_CHANNELS
-- ============================================
CREATE TYPE alert_channel_type AS ENUM ('email', 'webhook', 'slack', 'telegram', 'discord');

CREATE TABLE alert_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
    name VARCHAR(255) NOT NULL,
    type alert_channel_type NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_channels_tenant ON alert_channels(tenant_id);

-- ============================================
-- ALERT_RULES
-- ============================================
CREATE TYPE alert_trigger_type AS ENUM (
    'site_down',
    'ssl_expiring',
    'ssl_invalid',
    'performance_degraded',
    'update_available',
    'update_critical',
    'ecommerce_anomaly'
);

CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    trigger_type alert_trigger_type NOT NULL,
    conditions JSONB DEFAULT '{}',
    channel_ids UUID[] NOT NULL,
    cooldown_minutes INTEGER DEFAULT 60,
    last_triggered_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_tenant ON alert_rules(tenant_id);
CREATE INDEX idx_alert_rules_site ON alert_rules(site_id);

-- ============================================
-- ALERTS
-- ============================================
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_status AS ENUM ('triggered', 'acknowledged', 'resolved');

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT '00000000-0000-0000-0000-000000000001',
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    trigger_type alert_trigger_type NOT NULL,
    severity alert_severity NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    status alert_status DEFAULT 'triggered',
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    channels_notified alert_channel_type[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_tenant ON alerts(tenant_id);
CREATE INDEX idx_alerts_site ON alerts(site_id);
CREATE INDEX idx_alerts_status ON alerts(status) WHERE status != 'resolved';
CREATE INDEX idx_alerts_date ON alerts(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_sites_updated_at BEFORE UPDATE ON sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate uptime percentage
CREATE OR REPLACE FUNCTION calculate_uptime_percentage(
    p_site_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS DECIMAL AS $$
DECLARE
    total_checks INTEGER;
    up_checks INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE is_up = true)
    INTO total_checks, up_checks
    FROM uptime_checks
    WHERE site_id = p_site_id
      AND checked_at >= NOW() - (p_days || ' days')::INTERVAL;

    IF total_checks = 0 THEN
        RETURN NULL;
    END IF;

    RETURN ROUND((up_checks::DECIMAL / total_checks) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================
CREATE VIEW site_status_summary AS
SELECT
    s.id AS site_id,
    s.tenant_id,
    s.name,
    s.url,
    s.platform,
    s.is_active,
    s.tags,
    s.created_at,

    u.is_up AS current_status,
    u.response_time_ms AS last_response_time,
    u.checked_at AS last_uptime_check,

    calculate_uptime_percentage(s.id, 30) AS uptime_30d,

    ssl.is_valid AS ssl_valid,
    ssl.days_until_expiry AS ssl_days_remaining,

    (SELECT COUNT(*) FROM wp_updates wu WHERE wu.site_id = s.id AND wu.status = 'available') AS wp_updates_pending,
    (SELECT COUNT(*) FROM ps_updates pu WHERE pu.site_id = s.id AND pu.status = 'available') AS ps_updates_pending,

    p.performance_score AS last_perf_score,
    p.lcp_ms AS last_lcp

FROM sites s
LEFT JOIN LATERAL (
    SELECT * FROM uptime_checks
    WHERE site_id = s.id
    ORDER BY checked_at DESC
    LIMIT 1
) u ON true
LEFT JOIN LATERAL (
    SELECT * FROM ssl_checks
    WHERE site_id = s.id
    ORDER BY checked_at DESC
    LIMIT 1
) ssl ON true
LEFT JOIN LATERAL (
    SELECT * FROM performance_checks
    WHERE site_id = s.id
    ORDER BY checked_at DESC
    LIMIT 1
) p ON true;
