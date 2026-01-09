-- ============================================
-- DEVELOPMENT POLICIES (permissive)
-- Sostituire con policies restrittive in produzione
-- ============================================

-- Disabilita RLS per sviluppo (opzione più semplice)
-- Oppure crea policies permissive

-- SITES
ALTER TABLE sites DISABLE ROW LEVEL SECURITY;

-- UPTIME_CHECKS
ALTER TABLE uptime_checks DISABLE ROW LEVEL SECURITY;

-- SSL_CHECKS
ALTER TABLE ssl_checks DISABLE ROW LEVEL SECURITY;

-- PERFORMANCE_CHECKS
ALTER TABLE performance_checks DISABLE ROW LEVEL SECURITY;

-- WP_UPDATES
ALTER TABLE wp_updates DISABLE ROW LEVEL SECURITY;

-- PS_UPDATES
ALTER TABLE ps_updates DISABLE ROW LEVEL SECURITY;

-- ECOMMERCE_TRANSACTIONS
ALTER TABLE ecommerce_transactions DISABLE ROW LEVEL SECURITY;

-- ALERTS
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;

-- ALERT_CHANNELS
ALTER TABLE alert_channels DISABLE ROW LEVEL SECURITY;

-- ALERT_RULES
ALTER TABLE alert_rules DISABLE ROW LEVEL SECURITY;

-- TENANTS (mantieni accessibile)
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- USERS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- USER_TENANTS
ALTER TABLE user_tenants DISABLE ROW LEVEL SECURITY;
