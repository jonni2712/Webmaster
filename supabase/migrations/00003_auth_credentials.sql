-- ============================================
-- SCHEMA: Email/Password Authentication
-- ============================================

-- ============================================
-- AUTH_CREDENTIALS (password hash storage)
-- ============================================
CREATE TABLE auth_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_auth_credentials_user_id ON auth_credentials(user_id);

-- Auto-update updated_at trigger
CREATE TRIGGER tr_auth_credentials_updated_at BEFORE UPDATE ON auth_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTH_TOKENS (verification & password reset)
-- ============================================
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auth_tokens_token ON auth_tokens(token);
CREATE INDEX idx_auth_tokens_user_id_type ON auth_tokens(user_id, type);
CREATE INDEX idx_auth_tokens_expires_at ON auth_tokens(expires_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE auth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables (for security)
CREATE POLICY "Service role only for auth_credentials" ON auth_credentials
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for auth_tokens" ON auth_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- CLEANUP FUNCTION (for expired tokens)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM auth_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
