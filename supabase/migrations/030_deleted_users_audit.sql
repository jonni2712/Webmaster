-- ============================================
-- Deleted users audit trail
-- ============================================
-- GDPR Art. 17 requires deletion of personal data upon request, but
-- we need a minimal, anonymized trail to demonstrate compliance (e.g.
-- "this email was deleted on this date, by this IP") without retaining
-- the identifiable content itself.
--
-- We store a SHA-256 hash of the email instead of the email itself —
-- this lets us detect "was this email ever registered?" without
-- being able to enumerate deleted users.

CREATE TABLE IF NOT EXISTS deleted_users_audit (
    id BIGSERIAL PRIMARY KEY,
    email_hash VARCHAR(64) NOT NULL,   -- sha256 hex of lowercased email
    tenant_ids UUID[] NOT NULL DEFAULT '{}',
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_from_ip VARCHAR(45),       -- IPv4/IPv6 text form
    reason VARCHAR(100) DEFAULT 'user_requested'
);

CREATE INDEX IF NOT EXISTS idx_deleted_users_email_hash
    ON deleted_users_audit(email_hash);
CREATE INDEX IF NOT EXISTS idx_deleted_users_deleted_at
    ON deleted_users_audit(deleted_at DESC);

-- Service role only — this table is never exposed to authenticated
-- clients.
ALTER TABLE deleted_users_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for deleted_users_audit"
    ON deleted_users_audit
    FOR ALL USING (auth.role() = 'service_role');
