-- 027_external_scanner.sql
-- External scanner results for DNS, SSL, HTTP, CMS, WHOIS

CREATE TABLE IF NOT EXISTS external_scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  portfolio_site_id UUID REFERENCES portfolio_sites(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,

  -- DNS
  dns_a_records JSONB DEFAULT '[]',
  dns_mx_records JSONB DEFAULT '[]',
  dns_ns_records JSONB DEFAULT '[]',
  dns_txt_records JSONB DEFAULT '[]',
  dns_cname TEXT,
  dns_provider TEXT,
  email_provider TEXT,
  spf_configured BOOLEAN DEFAULT false,
  dmarc_configured BOOLEAN DEFAULT false,

  -- SSL
  ssl_issuer TEXT,
  ssl_expires_at TIMESTAMPTZ,
  ssl_valid BOOLEAN,
  ssl_protocol TEXT,

  -- HTTP
  http_status INTEGER,
  http_redirect_chain JSONB DEFAULT '[]',
  http_final_url TEXT,
  http_response_time_ms INTEGER,

  -- CMS
  cms_detected TEXT,
  cms_version TEXT,
  cms_confidence TEXT,
  cms_detection_method TEXT,
  cms_extras JSONB DEFAULT '{}',

  -- WHOIS
  whois_registrar TEXT,
  whois_expires_at TIMESTAMPTZ,
  whois_nameservers JSONB DEFAULT '[]',
  whois_updated_at TIMESTAMPTZ,

  -- Timestamps
  last_dns_scan_at TIMESTAMPTZ,
  last_cms_scan_at TIMESTAMPTZ,
  last_whois_scan_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tenant_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_external_scan_tenant ON external_scan_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_external_scan_site ON external_scan_results(site_id);
CREATE INDEX IF NOT EXISTS idx_external_scan_portfolio ON external_scan_results(portfolio_site_id);
CREATE INDEX IF NOT EXISTS idx_external_scan_domain ON external_scan_results(domain);

ALTER TABLE external_scan_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON external_scan_results
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  ));
