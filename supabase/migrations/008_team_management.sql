-- ============================================
-- Migration: 008_team_management.sql
-- Feature: v1.4.0 Team Management
-- ============================================

-- ============================================
-- TEAM INVITATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
    invited_by UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_tenant ON team_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);

-- ============================================
-- ACTIVITY LOGS
-- ============================================
DO $$ BEGIN
    CREATE TYPE activity_action_type AS ENUM (
        'member_invited',
        'member_joined',
        'member_removed',
        'role_changed',
        'site_created',
        'site_updated',
        'site_deleted',
        'client_created',
        'client_updated',
        'client_deleted',
        'site_access_granted',
        'site_access_revoked',
        'settings_updated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type activity_action_type NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    resource_name VARCHAR(255),
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_user_email VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant ON activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action_type);

-- ============================================
-- MEMBER SITE ACCESS
-- Explicit access required (no access by default)
-- ============================================
CREATE TABLE IF NOT EXISTS member_site_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_tenant_id UUID NOT NULL REFERENCES user_tenants(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_tenant_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_member_site_access_user_tenant ON member_site_access(user_tenant_id);
CREATE INDEX IF NOT EXISTS idx_member_site_access_site ON member_site_access(site_id);

-- ============================================
-- RLS POLICIES (Development - permissive)
-- ============================================

-- Team Invitations
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on team_invitations" ON team_invitations;
CREATE POLICY "Allow all operations on team_invitations"
    ON team_invitations FOR ALL
    USING (true)
    WITH CHECK (true);

-- Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on activity_logs" ON activity_logs;
CREATE POLICY "Allow all operations on activity_logs"
    ON activity_logs FOR ALL
    USING (true)
    WITH CHECK (true);

-- Member Site Access
ALTER TABLE member_site_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on member_site_access" ON member_site_access;
CREATE POLICY "Allow all operations on member_site_access"
    ON member_site_access FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- HELPER FUNCTION: Cleanup expired invitations
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    DELETE FROM team_invitations
    WHERE expires_at < NOW()
    AND accepted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE team_invitations IS 'Pending team member invitations';
COMMENT ON TABLE activity_logs IS 'Audit log of all tenant activities';
COMMENT ON TABLE member_site_access IS 'Explicit site access for team members (no access by default for member/viewer roles)';
COMMENT ON COLUMN member_site_access.user_tenant_id IS 'References user_tenants to link member-tenant relationship with site access';
