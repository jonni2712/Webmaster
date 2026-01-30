-- Migration 023: Fix RLS Performance Issues
-- 1. Wrap auth functions in (select ...) for init plan optimization
-- 2. Consolidate multiple permissive policies
-- 3. Remove duplicate indexes

-- ============================================
-- 1. FIX auth_rls_initplan - clients table
-- ============================================
DROP POLICY IF EXISTS "Users can view clients in their tenant" ON clients;
DROP POLICY IF EXISTS "Users can insert clients in their tenant" ON clients;
DROP POLICY IF EXISTS "Users can update clients in their tenant" ON clients;
DROP POLICY IF EXISTS "Users can delete clients in their tenant" ON clients;

CREATE POLICY "Users can view clients in their tenant" ON clients
    FOR SELECT USING (
        tenant_id IN (
            SELECT ut.tenant_id FROM user_tenants ut
            WHERE ut.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can insert clients in their tenant" ON clients
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT ut.tenant_id FROM user_tenants ut
            WHERE ut.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can update clients in their tenant" ON clients
    FOR UPDATE USING (
        tenant_id IN (
            SELECT ut.tenant_id FROM user_tenants ut
            WHERE ut.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Users can delete clients in their tenant" ON clients
    FOR DELETE USING (
        tenant_id IN (
            SELECT ut.tenant_id FROM user_tenants ut
            WHERE ut.user_id = (SELECT auth.uid())
        )
    );

-- ============================================
-- 2. FIX auth_rls_initplan - vercel_deployments table
-- ============================================
DROP POLICY IF EXISTS "Users can view deployments in their tenant" ON vercel_deployments;
DROP POLICY IF EXISTS "Admins can manage deployments in their tenant" ON vercel_deployments;

-- Consolidate into single policy (fixes both initplan and multiple_permissive)
CREATE POLICY "Tenant users can access deployments" ON vercel_deployments
    FOR ALL USING (
        tenant_id IN (
            SELECT ut.tenant_id FROM user_tenants ut
            WHERE ut.user_id = (SELECT auth.uid())
        )
    );

-- ============================================
-- 3. FIX auth_rls_initplan - servers table
-- ============================================
DROP POLICY IF EXISTS "servers_tenant_isolation" ON servers;

CREATE POLICY "servers_tenant_isolation" ON servers
    FOR ALL USING (
        tenant_id IN (
            SELECT ut.tenant_id FROM user_tenants ut
            WHERE ut.user_id = (SELECT auth.uid())
        )
    );

-- ============================================
-- 4. FIX auth_rls_initplan - brands table
-- ============================================
DROP POLICY IF EXISTS "brands_tenant_isolation" ON brands;

CREATE POLICY "brands_tenant_isolation" ON brands
    FOR ALL USING (
        tenant_id IN (
            SELECT ut.tenant_id FROM user_tenants ut
            WHERE ut.user_id = (SELECT auth.uid())
        )
    );

-- ============================================
-- 5. FIX multiple_permissive_policies - ecommerce_transactions
-- ============================================
DROP POLICY IF EXISTS "ecommerce_modify" ON ecommerce_transactions;
DROP POLICY IF EXISTS "ecommerce_select" ON ecommerce_transactions;

CREATE POLICY "ecommerce_transactions_tenant_access" ON ecommerce_transactions
    FOR ALL USING (
        site_id IN (
            SELECT s.id FROM sites s
            WHERE s.tenant_id IN (
                SELECT ut.tenant_id FROM user_tenants ut
                WHERE ut.user_id = (SELECT auth.uid())
            )
        )
    );

-- ============================================
-- 6. FIX multiple_permissive_policies - performance_checks
-- ============================================
DROP POLICY IF EXISTS "performance_checks_all" ON performance_checks;
DROP POLICY IF EXISTS "performance_checks_select" ON performance_checks;

CREATE POLICY "performance_checks_tenant_access" ON performance_checks
    FOR ALL USING (
        site_id IN (
            SELECT s.id FROM sites s
            WHERE s.tenant_id IN (
                SELECT ut.tenant_id FROM user_tenants ut
                WHERE ut.user_id = (SELECT auth.uid())
            )
        )
    );

-- ============================================
-- 7. FIX multiple_permissive_policies - ps_updates
-- ============================================
DROP POLICY IF EXISTS "ps_updates_modify" ON ps_updates;
DROP POLICY IF EXISTS "ps_updates_select" ON ps_updates;

CREATE POLICY "ps_updates_tenant_access" ON ps_updates
    FOR ALL USING (
        site_id IN (
            SELECT s.id FROM sites s
            WHERE s.tenant_id IN (
                SELECT ut.tenant_id FROM user_tenants ut
                WHERE ut.user_id = (SELECT auth.uid())
            )
        )
    );

-- ============================================
-- 8. FIX multiple_permissive_policies - ssl_checks
-- ============================================
DROP POLICY IF EXISTS "ssl_checks_all" ON ssl_checks;
DROP POLICY IF EXISTS "ssl_checks_select" ON ssl_checks;

CREATE POLICY "ssl_checks_tenant_access" ON ssl_checks
    FOR ALL USING (
        site_id IN (
            SELECT s.id FROM sites s
            WHERE s.tenant_id IN (
                SELECT ut.tenant_id FROM user_tenants ut
                WHERE ut.user_id = (SELECT auth.uid())
            )
        )
    );

-- ============================================
-- 9. FIX multiple_permissive_policies - wp_updates
-- ============================================
DROP POLICY IF EXISTS "wp_updates_modify" ON wp_updates;
DROP POLICY IF EXISTS "wp_updates_select" ON wp_updates;

CREATE POLICY "wp_updates_tenant_access" ON wp_updates
    FOR ALL USING (
        site_id IN (
            SELECT s.id FROM sites s
            WHERE s.tenant_id IN (
                SELECT ut.tenant_id FROM user_tenants ut
                WHERE ut.user_id = (SELECT auth.uid())
            )
        )
    );

-- ============================================
-- 10. FIX duplicate_index - sites table
-- ============================================
DROP INDEX IF EXISTS idx_sites_tenant;
-- Keep idx_sites_tenant_id as it has the clearer name
