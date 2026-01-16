-- Vercel Integration for Next.js sites
-- This migration adds support for Vercel deployment monitoring

-- Add Vercel-specific columns to sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS vercel_project_id VARCHAR(255);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS vercel_team_id VARCHAR(255);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS vercel_token_encrypted TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS vercel_last_sync TIMESTAMPTZ;

-- Create deployments table for tracking Vercel deployments
CREATE TABLE IF NOT EXISTS vercel_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    deployment_id VARCHAR(255) NOT NULL,
    deployment_url VARCHAR(500),
    state VARCHAR(50) NOT NULL, -- BUILDING, ERROR, INITIALIZING, QUEUED, READY, CANCELED
    target VARCHAR(50), -- production, preview
    git_branch VARCHAR(255),
    git_commit_sha VARCHAR(100),
    git_commit_message TEXT,
    git_commit_author VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL,
    ready_at TIMESTAMPTZ,
    build_duration_ms INTEGER,
    error_message TEXT,
    meta JSONB DEFAULT '{}',
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, deployment_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vercel_deployments_site_id ON vercel_deployments(site_id);
CREATE INDEX IF NOT EXISTS idx_vercel_deployments_tenant_id ON vercel_deployments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vercel_deployments_state ON vercel_deployments(state);
CREATE INDEX IF NOT EXISTS idx_vercel_deployments_created_at ON vercel_deployments(created_at DESC);

-- Add RLS policies
ALTER TABLE vercel_deployments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view deployments for sites in their tenant
CREATE POLICY "Users can view deployments in their tenant"
    ON vercel_deployments FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
        )
    );

-- Policy: Only admins/owners can insert deployments (via service role)
CREATE POLICY "Service role can manage deployments"
    ON vercel_deployments FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add Vercel webhook secret to sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS vercel_webhook_secret VARCHAR(255);
