# External Scanner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an external scanner that automatically collects DNS, SSL, HTTP, CMS, and WHOIS data for all sites and domains in the platform without requiring server access.

**Architecture:** Two cron endpoints scan all sites/domains at different intervals. A shared scanner library does the actual detection. Results are stored in a single `external_scan_results` table and displayed inline on existing pages with expandable detail views.

**Tech Stack:** Next.js API routes (cron), Node.js `dns` module, `tls` module, native `fetch`, `whois-json` package, Zod validation, Supabase, React components with shadcn/ui

**Design Doc:** `docs/plans/2026-03-23-external-scanner-design.md`

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/027_external_scanner.sql`

Create the `external_scan_results` table with flexible site/portfolio linking, DNS/SSL/HTTP/CMS/WHOIS columns, and separate scan timestamps.

```sql
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
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `src/types/database.ts`

Add after the Phase 3 types:

```typescript
// External Scanner types

export interface ExternalScanResult {
  id: string;
  tenant_id: string;
  site_id: string | null;
  portfolio_site_id: string | null;
  domain: string;
  // DNS
  dns_a_records: string[];
  dns_mx_records: Array<{ priority: number; exchange: string }>;
  dns_ns_records: string[];
  dns_txt_records: string[];
  dns_cname: string | null;
  dns_provider: string | null;
  email_provider: string | null;
  spf_configured: boolean;
  dmarc_configured: boolean;
  // SSL
  ssl_issuer: string | null;
  ssl_expires_at: string | null;
  ssl_valid: boolean | null;
  ssl_protocol: string | null;
  // HTTP
  http_status: number | null;
  http_redirect_chain: Array<{ url: string; status: number }>;
  http_final_url: string | null;
  http_response_time_ms: number | null;
  // CMS
  cms_detected: string | null;
  cms_version: string | null;
  cms_confidence: 'high' | 'medium' | 'low' | null;
  cms_detection_method: string | null;
  cms_extras: Record<string, unknown>;
  // WHOIS
  whois_registrar: string | null;
  whois_expires_at: string | null;
  whois_nameservers: string[];
  whois_updated_at: string | null;
  // Timestamps
  last_dns_scan_at: string | null;
  last_cms_scan_at: string | null;
  last_whois_scan_at: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Task 3: DNS Scanner Library

**Files:**
- Create: `src/lib/scanner/dns-scanner.ts`

Uses Node.js `dns/promises` module. For each domain:
- Resolve A, MX, TXT, NS, CNAME records
- Derive dns_provider from NS records (map known patterns: cloudflare, register.it, aruba, ovh, aws, google, etc.)
- Derive email_provider from MX records (google, microsoft, custom)
- Check SPF (TXT contains "v=spf1") and DMARC (query _dmarc.domain TXT)

```typescript
// Key function signature:
export async function scanDns(domain: string): Promise<DnsScanResult>
```

All DNS calls wrapped in try/catch — missing records are null, not errors.

---

## Task 4: SSL Scanner Library

**Files:**
- Create: `src/lib/scanner/ssl-scanner.ts`

Uses Node.js `tls` module to connect on port 443:
- Get certificate details (issuer, expiry, protocol)
- Determine validity
- 5 second timeout

```typescript
export async function scanSsl(domain: string): Promise<SslScanResult>
```

---

## Task 5: HTTP Scanner Library

**Files:**
- Create: `src/lib/scanner/http-scanner.ts`

Uses native fetch with redirect: 'manual' to follow chain:
- Record each redirect (URL + status code)
- Measure total response time
- Return final status, URL, response time, redirect chain
- 10 second timeout
- Also returns the HTML body of the final response (for CMS detection)

```typescript
export async function scanHttp(domain: string): Promise<HttpScanResult>
```

---

## Task 6: CMS Detector Library

**Files:**
- Create: `src/lib/scanner/cms-detector.ts`

Three-phase detection:

Phase 1 — Headers + Meta (from HTTP response already fetched):
- `X-Powered-By` header
- `X-Generator` header
- `<meta name="generator" content="...">` tag

Phase 2 — Path probing (only if Phase 1 inconclusive):
- HEAD requests to known CMS paths
- `/wp-login.php` (200/302 = WordPress)
- `/administrator/` (200 = Joomla)
- `/admin/login` (200 = PrestaShop/Laravel)
- `/user/login` (200 = Drupal)
- `/_next/` (200 = Next.js)

Phase 3 — HTML analysis:
- `/wp-content/` in paths → WordPress
- `/wp-includes/` → WordPress (+ version from asset query strings)
- `/sites/default/files/` → Drupal
- `/media/jui/` → Joomla
- Shopify CDN patterns → Shopify
- `wc-blocks` → WooCommerce
- `elementor` → Elementor
- Common theme/plugin patterns

Returns: cms_type, version (if found), confidence level, detection method, extras (detected plugins/builders).

```typescript
export async function detectCms(
  domain: string,
  httpResult: HttpScanResult
): Promise<CmsDetectionResult>
```

---

## Task 7: WHOIS Scanner Library

**Files:**
- Create: `src/lib/scanner/whois-scanner.ts`

Install `whois-json` package. For each domain:
- Query WHOIS data
- Extract: registrar, expiry date, nameservers, last updated
- Handle .it domains specifically (NIC.it format)

```typescript
export async function scanWhois(domain: string): Promise<WhoisScanResult>
```

Rate-limited: max 1 WHOIS query per second to avoid blocks.

---

## Task 8: Scanner Orchestrator

**Files:**
- Create: `src/lib/scanner/orchestrator.ts`

Coordinates scanning across all domains. Two modes:

`scanDnsSsl(tenantId)` — DNS + SSL + HTTP for all domains (6h cycle)
`scanCmsWhois(tenantId)` — CMS + WHOIS for all domains (24h cycle)

Logic:
1. Fetch all unique domains (from sites + portfolio_sites)
2. For each domain, run the appropriate scanners
3. Upsert results into external_scan_results
4. Process in batches of 10 with concurrency control

```typescript
export async function runDnsSslScan(tenantId: string): Promise<ScanSummary>
export async function runCmsWhoisScan(tenantId: string): Promise<ScanSummary>
```

---

## Task 9: Domain Collector Utility

**Files:**
- Create: `src/lib/scanner/domain-collector.ts`

Collects all unique domains across both tables:
- From `sites`: extract domain from URL field
- From `portfolio_sites`: use domain field directly
- Deduplicate by domain
- Return with source info (site_id, portfolio_site_id, or both)

```typescript
export async function collectDomains(tenantId: string): Promise<DomainEntry[]>
```

---

## Task 10: Cron API Routes

**Files:**
- Create: `src/app/api/cron/scan-dns-ssl/route.ts`
- Create: `src/app/api/cron/scan-cms-whois/route.ts`

Both routes:
- Verify CRON_SECRET header
- Fetch all tenants
- For each tenant, run the appropriate scanner
- Return summary

Add to vercel.json cron config:
```json
{
  "crons": [
    { "path": "/api/cron/scan-dns-ssl", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/scan-cms-whois", "schedule": "0 3 * * *" }
  ]
}
```

---

## Task 11: Scan Results API Endpoint

**Files:**
- Create: `src/app/api/scanner/[domain]/route.ts`
- Create: `src/app/api/scanner/route.ts`

GET `/api/scanner` — list all scan results for tenant (with optional filters)
GET `/api/scanner/[domain]` — scan result for a specific domain
POST `/api/scanner/[domain]` — trigger manual re-scan for a domain

---

## Task 12: Middleware Update

**Files:**
- Modify: `src/middleware.ts`

Add cron scan routes to the bypass list (they use CRON_SECRET, not session auth):
- `/api/cron/scan-dns-ssl`
- `/api/cron/scan-cms-whois`

---

## Task 13: Scan Badge Components

**Files:**
- Create: `src/components/scanner/scan-badges.tsx`

Reusable inline badge components:
- `CmsBadge` — shows detected CMS + version with color-coded confidence
- `DnsBadge` — shows DNS provider + target IP
- `EmailBadge` — shows email provider (Google, Microsoft, custom)
- `SecurityBadges` — SPF ✓/✗ + DMARC ✓/✗ mini badges
- `SslBadge` — issuer + days to expiry
- `HttpBadge` — status code + response time

---

## Task 14: Scan Detail Expandable Component

**Files:**
- Create: `src/components/scanner/scan-detail.tsx`

Expandable panel showing full scan data:
- DNS Records table (type, name, value)
- Redirect chain visualization
- WHOIS info (registrar, expiry, nameservers)
- CMS detection details (method, confidence, extras)
- All TXT records

---

## Task 15: Integrate Badges into Sites Page

**Files:**
- Modify: `src/app/(dashboard)/sites/page.tsx` (or equivalent sites list)

Add scan badges inline on each site card/row. Fetch scan data alongside site data.

---

## Task 16: Integrate Badges into Portfolio Domains Page

**Files:**
- Modify: `src/app/(dashboard)/portfolio/domains/page.tsx` (or equivalent)

Add scan badges inline on each domain row. Fetch scan data alongside domain data.

---

## Summary

| Task | Area | Description |
|------|------|-------------|
| 1 | DB | Migration — external_scan_results table |
| 2 | Types | ExternalScanResult interface |
| 3 | Scanner | DNS scanner (A, MX, NS, TXT, CNAME + derivations) |
| 4 | Scanner | SSL scanner (TLS handshake) |
| 5 | Scanner | HTTP scanner (status, redirects, response time, HTML body) |
| 6 | Scanner | CMS detector (headers + probing + HTML analysis) |
| 7 | Scanner | WHOIS scanner |
| 8 | Scanner | Orchestrator (batch processing, concurrency) |
| 9 | Scanner | Domain collector (sites + portfolio dedup) |
| 10 | API | Cron routes + vercel.json config |
| 11 | API | Scanner results endpoints |
| 12 | Middleware | Bypass cron routes |
| 13 | UI | Scan badge components |
| 14 | UI | Scan detail expandable |
| 15 | UI | Integrate into Sites page |
| 16 | UI | Integrate into Portfolio page |

### Parallel tracks

- **Track A (Scanner libs):** Tasks 3→4→5→6→7→8→9
- **Track B (Platform):** Tasks 1→2→10→11→12
- **Track C (UI):** Tasks 13→14→15→16 (after Track B)
