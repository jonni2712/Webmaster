# Implementation Plan — Webmaster Monitor

> **Last updated**: 2026-04-08
> **Owner**: Jonathan Boccotti
> **Goal**: Bring the platform from "internal beta" to "production-ready SaaS sellable to paying customers"

This document is the source of truth for what's left to build. Update it as items move from `[ ]` to `[x]`.

---

## Executive summary

| Phase | Goal | Effort | Blocker for |
|---|---|---|---|
| **0 — Quick wins** | Plug technical debt exposed during 2026-04-07/08 audit | 5-10h | Stable production |
| **1 — Pre-launch hardening** | Lock down limits, retention, GDPR, onboarding | 30-50h | Public registration |
| **2 — Stripe billing** | Accept payments, enforce plans, customer portal | 30-50h | Revenue |
| **3 — Quality & scale** | CI/CD, tests, OAuth providers, audit log, 2FA | 40-60h | Enterprise customers |
| **4 — Growth & polish** | i18n, mobile, compliance docs, white-label | 60-100h | International market |
| **Total** | | **165-270h** | |

### Critical dependency chain

```
Phase 0  →  Phase 1.plans-table  →  Phase 2 (Stripe)
    ↓             ↓                        ↓
    ↓        Phase 1.retention       Phase 3.tests
    ↓             ↓                        ↓
    └──→  Phase 1.gdpr  →  Public launch
```

**Plans table is the keystone**: it unlocks Stripe (Phase 2), retention (Phase 1.6), and `max_sites` enforcement (Phase 0.2). Build it early.

---

## Already completed (2026-04-07/08)

These items are LIVE in production. Not part of the remaining plan but listed for context.

- [x] Egress Supabase optimization (−4-5 GB/month)
- [x] API key encryption at rest (AES-256-GCM, 6 keys migrated)
- [x] User registration enabled (`/api/auth/register`) with tenant-per-user isolation
- [x] OAuth signup tenant fix (no more shared Personal tenant)
- [x] Dashboard auth re-enabled
- [x] Rate limiting on all auth endpoints (Postgres-backed)
- [x] SMTP email backend (nodemailer + Resend fallback) — cPanel `mail.webmaster-monitor.it`
- [x] Edge → Node.js runtime migration (cron uptime, ssl, digest)
- [x] Pricing plans honesty pass (Free/Pro/Enterprise aligned with DB enum)
- [x] Webmaster Agency tenant promoted to enterprise/max_sites=10000
- [x] SMTP env vars on Vercel production
- [x] Personal tenant orphan membership cleaned

---

# Phase 0 — Quick wins ✅ COMPLETED (2026-04-08)

**Goal**: Plug the cracks exposed by today's audit. Independent items, can be done in any order.

**Total effort**: 5-10 hours
**Status**: ✅ Done — deployed to production, verified via `/api/health`

### 0.1 Cron uptime throughput fix ✅

**Why**: Currently the cron processes ~70 sites per 60s run because of `BATCH_SIZE=10` and `maxDuration=60`. With 755 active sites the effective re-check interval is ~10 hours, not the 15 min we promise.

**Fix**:
- Bump `maxDuration` from 60s to 300s (Vercel default since 2025)
- Increase `BATCH_SIZE` from 10 to 30 (more parallel HTTP requests)
- Optionally: split into 2 separate cron schedules at minute 0 and minute 7 to halve per-run load

**Files**: `src/app/api/cron/uptime/route.ts`, `vercel.json`

**Acceptance**:
- After deploy, all 755 active sites have `last_check < 30 min` within 1 hour
- SQL: `SELECT COUNT(*) FROM sites WHERE is_active AND uptime_check_enabled AND last_check > NOW() - INTERVAL '30 minutes'` returns ≥ 750

**Effort**: 1-2h

**Result**: 750/755 sites (99.3%) covered in 30 min window. 816 checks in 30 min (vs 276/hour before). ~19x throughput improvement.

---

### 0.2 `max_sites` enforcement on POST /api/sites ✅

**Why**: A free user (`max_sites=3`) can currently add 10000 sites — no check exists. Cost & abuse risk.

**Fix**:
- In `POST /api/sites`, before insert: count current sites for the tenant, compare to `tenants.max_sites`
- Return 403 with `{error: "Limite del piano raggiunto", current, max}` if exceeded
- Add a small helper `assertCanAddSite(tenantId)` in `src/lib/billing/limits.ts` for reuse
- UI: show "X / Y siti utilizzati" badge in Sidebar/Header (optional, but cheap)

**Files**:
- `src/lib/billing/limits.ts` (new)
- `src/app/api/sites/route.ts` (POST handler)
- `src/components/layout/sidebar.tsx` (optional UI badge)

**Acceptance**:
- Manual test: create a tenant with `max_sites=2`, add 2 sites OK, 3rd returns 403
- Free tenant can't add a 4th site

**Effort**: 1-2h

**Result**: POST /api/sites now returns 403 PLAN_LIMIT_REACHED when tenant exceeds max_sites. Subsites excluded from the count (they inherit from parent).

---

### 0.3 Health check endpoint `/api/health` ✅

**Why**: Currently no way to know if the app is up except by checking the homepage. Useful for external monitoring (incl. monitoring your own app with itself).

**Fix**:
- New `GET /api/health` returns `{status, checks: {db, smtp, supabase}}` with appropriate HTTP code
- DB check: simple `SELECT 1` via supabase admin client
- SMTP check: `transporter.verify()` (cached, max once per minute)
- Returns 200 if all OK, 503 if any check fails
- No auth required (it's a health endpoint)

**Files**: `src/app/api/health/route.ts` (new)

**Acceptance**:
- `curl https://...vercel.app/api/health` returns 200 with all green
- After breaking SMTP_PASS deliberately, returns 503 with `checks.smtp = "fail"`

**Effort**: 1-2h

**Result**: Live at production. Verified response: `{"status":"ok","checks":{"db":{"ok":true},"smtp":{"ok":true}},"version":"..."}`. Required also a middleware allowlist fix to bypass NextAuth redirect.

---

### 0.4 SMTP smoke test in production ✅

**Why**: SMTP is configured on Vercel but never tested end-to-end with a real signup.

**Fix**:
- Trigger a redeploy to pick up the new env vars (`vercel --prod`)
- Create a test account via the live `/register` page with a real email
- Verify the verification email arrives via cPanel
- Click the link, log in, see dashboard

**Acceptance**:
- Test signup completes end-to-end
- Verification email arrives within 1 minute
- Email source headers show `mail.webmaster-monitor.it` as the sending server (not Resend)

**Effort**: 0.5h

**Result**: SMTP connection + auth verified from Vercel production function via `/api/health` (765 ms handshake to `mail.webmaster-monitor.it:465`). Real signup test pending DNS propagation of `webmaster-monitor.it` to Vercel.

---

# Phase 1 — Pre-launch hardening

**Goal**: Make the platform safe for **public** signup (anyone, not just you).

**Total effort**: 30-50 hours
**Prerequisite**: Phase 0 complete

### 1.1 Plans table (KEYSTONE)

**Why**: Currently plan limits are spread across:
- DB enum: `tenants.plan IN ('free', 'pro', 'enterprise')`
- Hardcoded `max_sites` integer per tenant row
- Code constants (`max_sites: 3` in register endpoint)
- Marketing copy (landing page features)
- ROADMAP.md text

This duplication will make Stripe integration painful and inconsistent. Centralize everything in a `plans` table.

**Migration `029_plans_table.sql`**:
```sql
CREATE TABLE plans (
    id VARCHAR(50) PRIMARY KEY,           -- 'free', 'pro', 'enterprise'
    name VARCHAR(100) NOT NULL,           -- 'Free', 'Pro', 'Enterprise'
    price_eur INTEGER NOT NULL,           -- monthly price in EUR cents
    stripe_price_id VARCHAR(255),         -- populated when Stripe is added
    max_sites INTEGER NOT NULL,
    max_team_members INTEGER NOT NULL,
    retention_days INTEGER NOT NULL,      -- how long to keep uptime_checks etc.
    uptime_check_min_minutes INTEGER NOT NULL,  -- 15 / 5 / 5
    features JSONB NOT NULL DEFAULT '{}', -- {api_access: true, white_label: false, ...}
    sort_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed
INSERT INTO plans (id, name, price_eur, max_sites, max_team_members, retention_days, uptime_check_min_minutes, features, sort_order) VALUES
('free',       'Free',       0,    3,    1,  7,   15, '{"channels": ["email"], "scanner": false, "agent": false, "api": false}', 1),
('pro',        'Pro',        2900, 25,   3,  30,  5,  '{"channels": ["email","slack","telegram","discord","webhook"], "scanner": true, "agent": false, "api": false, "support": "priority"}', 2),
('enterprise', 'Enterprise', 7900, 10000, 50, 365, 5, '{"channels": ["email","slack","telegram","discord","webhook"], "scanner": true, "agent": true, "api": true, "account_manager": true}', 3);

-- Add foreign key reference (keep existing plan column for backward compat)
ALTER TABLE tenants ADD COLUMN plan_id VARCHAR(50) REFERENCES plans(id);
UPDATE tenants SET plan_id = plan;  -- migrate existing values
```

**Helper library `src/lib/billing/plans.ts`**:
- `getPlanFor(tenantId)` → `Plan` object with all limits
- `canTenantUse(tenantId, feature)` → boolean
- Cached in-memory for hot paths

**Refactor**:
- `register/route.ts` and OAuth callback: read `plans` table instead of hardcoding `max_sites: 3`
- Landing page: read plans server-side from DB (or hardcode but with same source of truth)

**Files**:
- `supabase/migrations/029_plans_table.sql` (new)
- `src/lib/billing/plans.ts` (new)
- `src/app/api/auth/register/route.ts`
- `src/lib/auth/config.ts` (OAuth callback)
- `src/types/database.ts` (add Plan type)

**Acceptance**:
- All 3 plans seeded in DB
- `getPlanFor('free')` returns `{max_sites: 3, retention_days: 7, ...}`
- New signup creates tenant with `plan_id = 'free'`
- Existing tenants migrated correctly (Webmaster Agency stays enterprise)

**Effort**: 6-8h

---

### 1.2 Retention per plan (cron cleanup)

**Why**: Currently `uptime_checks`, `ssl_checks`, `alerts`, `external_scan_results`, `wp_updates` grow forever. The DB will explode and we promise different retention per plan.

**Fix**:
- New cron `/api/cron/cleanup-history` (daily, 4 AM)
- For each tenant, look up `plan.retention_days`
- Delete rows older than `retention_days` from: `uptime_checks`, `ssl_checks`, `performance_checks`, `alerts` (resolved), `external_scan_results`
- Use batched deletes (1000 rows at a time) to avoid lock contention
- Log how many rows deleted per tenant per table

**Files**:
- `src/app/api/cron/cleanup-history/route.ts` (new)
- `vercel.json` (add cron entry)

**Acceptance**:
- Free tenant: rows older than 7 days are gone
- Enterprise tenant: rows older than 365 days are gone
- DB size before/after measurable difference

**Effort**: 4-6h

---

### 1.3 GDPR data export endpoint

**Why**: Required by law for EU customers. They must be able to download all their data.

**Fix**:
- `GET /api/user/export` (authenticated)
- Returns a JSON file with: user profile, tenant settings, all sites, all alerts (last 30 days), all alert channels, all activity logs
- Streams the JSON response as `application/json` with `Content-Disposition: attachment`
- Rate limited (1 export per user per hour)

**Files**: `src/app/api/user/export/route.ts` (new)

**Acceptance**:
- Authenticated user calls endpoint, downloads file
- File contains only their tenant's data, no leakage

**Effort**: 4-6h

---

### 1.4 GDPR data delete endpoint

**Why**: "Right to be forgotten". Users must be able to delete their account and all data.

**Fix**:
- `DELETE /api/user/me` (authenticated, requires password confirmation)
- If user is `owner` of a tenant with other members: refuse, ask to transfer ownership first
- If user is sole owner: delete all tenant data via CASCADE (sites, alerts, etc.)
- Delete user row, auth_credentials, auth_tokens, user_tenants
- Send a confirmation email
- Log the action in a `deleted_users` audit table (just `email_hash + deleted_at` for legal trail)

**Files**:
- `supabase/migrations/030_deleted_users_audit.sql` (new — minimal table)
- `src/app/api/user/me/route.ts` (DELETE handler)
- `src/app/(dashboard)/settings/page.tsx` (UI: "Elimina account" section with confirmation modal)

**Acceptance**:
- User deletes account, all their data is gone, can't log in anymore
- Email confirms the deletion
- Owner-with-team scenario: clear error message, account NOT deleted

**Effort**: 6-8h

---

### 1.5 Test notification button on alert channels

**Why**: Users currently configure Slack/Telegram/webhook channels with no way to verify they work until a real alert fires. High frustration.

**Fix**:
- Add `POST /api/alert-channels/[id]/test` endpoint
- Sends a fake "test" alert via the channel's dispatcher
- Returns success/failure with the actual response from the channel
- UI: "Invia test" button next to each channel in Settings → Notifiche

**Files**:
- `src/app/api/alert-channels/[id]/test/route.ts` (new)
- `src/components/settings/alert-channels-section.tsx` (or similar)

**Acceptance**:
- Click "Invia test" on a Slack channel → message appears in Slack
- Click on a webhook channel → POST request hits the URL
- Click on a misconfigured channel → error message displayed

**Effort**: 3-4h

---

### 1.6 Onboarding wizard

**Why**: New users land on an empty dashboard with no idea what to do. High first-day churn.

**Fix**:
- Detect "first time user" (no sites, no tenant settings) on dashboard load
- Show a 4-step wizard overlay:
  1. Welcome + brief explanation
  2. Add your first site (URL only — auto-detect platform)
  3. (For WordPress) Install plugin guided steps + auto-test
  4. Configure email notifications
- Skippable but persistent (banner: "Completa la configurazione")

**Files**:
- `src/components/onboarding/wizard.tsx` (new)
- `src/components/onboarding/steps/*.tsx` (new — one per step)
- `src/app/(dashboard)/dashboard/page.tsx` (mount wizard if first-time)
- `users` table: add `onboarding_completed_at TIMESTAMPTZ` column

**Acceptance**:
- New signup → wizard appears immediately
- Completes wizard → never shows again
- Skip wizard → banner stays until dismissed permanently

**Effort**: 12-20h

---

# Phase 2 — Stripe billing

**Goal**: Accept payments, automatically enforce plans, handle cancellations and failures.

**Total effort**: 30-50 hours
**Prerequisite**: Phase 1.1 (plans table) complete

### 2.1 Stripe account & product setup (manual)

**Setup**:
- Create Stripe account (or use existing)
- Create 2 products: "Pro" (€29/month) and "Enterprise" (€79/month)
- Get the `price_id` for each
- Update `plans.stripe_price_id` with the values
- Configure webhook endpoint (will be added in 2.3)
- Enable Customer Portal in Stripe Dashboard

**Effort**: 1-2h (mostly external)

---

### 2.2 Checkout session endpoint

**Fix**:
- `POST /api/billing/checkout` body: `{plan_id}`
- Looks up `plan.stripe_price_id`
- Creates a Stripe Checkout Session with `mode: 'subscription'`, `customer_email: user.email`, `metadata: {tenant_id, plan_id}`
- Returns `{checkout_url}`
- Frontend redirects user to Stripe-hosted checkout page

**Install**: `npm install stripe`

**Files**:
- `src/lib/billing/stripe.ts` (Stripe client init)
- `src/app/api/billing/checkout/route.ts` (new)
- `src/app/(dashboard)/settings/billing/page.tsx` (new — pricing UI with "Upgrade" buttons)

**Effort**: 4-6h

---

### 2.3 Stripe webhook handler

**Fix**:
- `POST /api/webhooks/stripe`
- Verifies Stripe signature using `stripe.webhooks.constructEvent`
- Handles events:
  - `checkout.session.completed` → set `tenant.plan_id`, store `stripe_customer_id`, `stripe_subscription_id`
  - `customer.subscription.updated` → update plan if changed
  - `customer.subscription.deleted` → downgrade tenant to `free`
  - `invoice.payment_failed` → log + email user (dunning starts)
  - `invoice.payment_succeeded` → log
- Idempotency: check `stripe_event_id` against an `processed_stripe_events` table
- Returns 200 quickly (Stripe retries on non-2xx)

**Migration `031_stripe_billing.sql`**:
```sql
ALTER TABLE tenants ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE tenants ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE tenants ADD COLUMN subscription_status VARCHAR(50);
ALTER TABLE tenants ADD COLUMN subscription_current_period_end TIMESTAMPTZ;

CREATE TABLE processed_stripe_events (
    id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files**:
- `supabase/migrations/031_stripe_billing.sql` (new)
- `src/app/api/webhooks/stripe/route.ts` (new)

**Effort**: 8-12h

---

### 2.4 Customer portal redirect

**Fix**:
- `POST /api/billing/portal` (authenticated)
- Creates a Stripe Customer Portal session for the user's `stripe_customer_id`
- Returns `{portal_url}`
- UI: "Gestisci abbonamento" button in Settings → Billing

**Files**:
- `src/app/api/billing/portal/route.ts` (new)
- `src/app/(dashboard)/settings/billing/page.tsx` (button)

**Effort**: 2-3h

---

### 2.5 Plan enforcement integration

**Fix**:
- Refactor `assertCanAddSite()` (from 0.2) to read `plans` table via `plan_id` instead of `max_sites` column
- Add `assertCanInviteMember()` for team invites (uses `plan.max_team_members`)
- Add `assertCanUseFeature(tenantId, feature)` for feature flags
- Wire into: `POST /api/sites`, `POST /api/team/invitations`, scanner endpoints, agent endpoints

**Files**: `src/lib/billing/limits.ts` (refactor), `src/app/api/sites/route.ts`, `src/app/api/team/invitations/*`, etc.

**Effort**: 4-6h

---

### 2.6 Failed payment dunning

**Fix**:
- When `invoice.payment_failed` arrives:
  - Mark tenant as `subscription_status = 'past_due'`
  - Send email to owner: "Pagamento fallito, aggiorna metodo entro 7 giorni"
  - After 7 days (cron): downgrade to `free`, send notification
- After successful retry: restore previous plan

**Files**: webhook handler + new cron `/api/cron/dunning`

**Effort**: 4-6h

---

### 2.7 End-to-end test in Stripe test mode

**Validate**:
- Sign up as new user
- Click "Upgrade to Pro"
- Use Stripe test card `4242 4242 4242 4242`
- Verify tenant `plan_id` updates to `pro`
- Verify `max_sites=25` is now enforced
- Verify customer portal works
- Cancel subscription → verify downgrade to `free`
- Use failing card `4000 0000 0000 0341` → verify dunning email

**Effort**: 2-4h

---

# Phase 3 — Quality & scale

**Goal**: Make the platform reliable for enterprise customers and the team.

**Total effort**: 40-60 hours

### 3.1 Test infrastructure (Vitest + MSW)

**Why**: Currently zero automated tests. Every commit is a roll of dice.

**Setup**:
- Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`
- Add `vitest.config.ts` with proper aliases
- Create `src/test/setup.ts` with MSW server, Supabase mock client
- Add npm scripts: `test`, `test:watch`, `test:coverage`

**Initial test coverage** (smoke + critical paths):
- `crypto.test.ts` — encrypt/decrypt roundtrip + legacy passthrough
- `rate-limit.test.ts` — basic limit + window expiry
- `register/route.test.ts` — happy path + duplicate email
- `plans.test.ts` — getPlanFor + assertCanAddSite

**Files**: `vitest.config.ts`, `src/test/setup.ts`, multiple `*.test.ts` files

**Effort**: 8-12h

---

### 3.2 GitHub Actions CI

**Pipeline `.github/workflows/ci.yml`**:
- Trigger: pull_request + push to master
- Steps: install deps → lint → typecheck → vitest → build (without deploy)
- Block PR merge if any fails

**Effort**: 2-4h

---

### 3.3 OAuth GitHub + Google live

**Setup**:
- Create GitHub OAuth App at https://github.com/settings/developers
- Create Google OAuth Client at https://console.cloud.google.com
- Add `GITHUB_CLIENT_ID/SECRET` and `GOOGLE_CLIENT_ID/SECRET` to Vercel production
- Add `NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true` and `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true`
- Test OAuth signup → verify dedicated tenant created (already coded)

**Effort**: 2-4h

---

### 3.4 Audit log for security events

**Why**: Track who did what, when. Required for SOC 2 / enterprise customers.

**Migration `032_audit_log.sql`**:
```sql
CREATE TABLE security_audit_log (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON security_audit_log(tenant_id, created_at DESC);
```

**Events tracked**:
- `login_success`, `login_failed`, `password_changed`, `password_reset_requested`
- `api_key_created`, `api_key_revoked`
- `permission_changed`, `member_invited`, `member_removed`
- `data_exported`, `account_deleted`

**Helper**: `src/lib/audit/logger.ts` with `logSecurityEvent({tenant, user, type, metadata})`

**UI**: Settings → Audit Log (admin only)

**Effort**: 6-10h

---

### 3.5 Two-factor authentication (TOTP)

**Why**: Standard expectation for any SaaS holding customer data.

**Fix**:
- Install `otpauth` package
- New tables: `auth_2fa_secrets` (user_id, encrypted_secret, backup_codes)
- Setup flow: Settings → Security → Enable 2FA → show QR → user scans → verify code → backup codes shown
- Login flow: after password verification, if user has 2FA, prompt for code
- NextAuth: extend credentials provider with `code` field

**Files**:
- `supabase/migrations/033_2fa.sql` (new)
- `src/lib/auth/totp.ts` (new)
- `src/app/api/user/2fa/setup/route.ts` (new)
- `src/app/api/user/2fa/verify/route.ts` (new)
- `src/app/api/user/2fa/disable/route.ts` (new)
- `src/lib/auth/config.ts` (extend authorize)
- Settings UI section

**Effort**: 12-16h

---

### 3.6 Public status page

**Why**: Customer-facing transparency. Reduces support tickets during incidents.

**Options**:
- **Build it**: simple page reading from `uptime_checks` of your own monitored sites
- **Use external**: Statuspage.io, Instatus, BetterStack — paid

Recommend building it: ~6-8h, full control, also serves as a marketing demo of your platform.

**Effort**: 6-10h

---

# Phase 4 — Growth & polish

**Goal**: Unlock new markets and reduce support load.

**Total effort**: 60-100 hours

### 4.1 Compliance documents (DPA, sub-processor list, accessibility)

- DPA template (Data Processing Agreement) — needed for B2B EU sales
- Sub-processor list page (`/sub-processors`) — Supabase, Vercel, Resend (or cPanel), Sentry, Stripe
- Accessibility statement (`/accessibility`)
- Cookie policy detailed (currently just a banner)

**Effort**: 4-8h (mostly writing, some legal review)

---

### 4.2 Report PDF/CSV export

**Why**: Removed from landing page in honesty pass, but customers will ask.

**Fix**:
- Install `@react-pdf/renderer`
- Create PDF templates: uptime report, ssl status, full audit
- New endpoints: `GET /api/sites/[id]/reports/[type]?format=pdf|csv`
- UI: "Esporta report" button on site detail page

**Effort**: 12-20h

---

### 4.3 i18n English support

**Why**: Currently 100% Italian. English unlocks the rest of EU + worldwide.

**Fix**:
- Install `next-intl`
- Extract all hardcoded strings to `messages/it.json` and `messages/en.json`
- Add language switcher in header
- Detect browser locale on first visit
- Translate all UI strings (~600-800 strings)

**Effort**: 40-80h (mostly translation effort)

---

### 4.4 Mobile responsive polish + PWA

- Audit mobile UX (sidebar, tables, forms)
- Add PWA manifest + service worker for installable web app
- (Optional) Push notifications for alerts

**Effort**: 8-16h

---

### 4.5 Sharding cron uptime for >5000 sites

**When**: After Phase 0.1, if you grow past ~3000 sites the single cron starts to choke even with `maxDuration=300`.

**Fix**:
- Split sites into N shards (hash of `site.id`)
- Run N cron jobs at offset minutes (cron `*/15 * * * *` minute 0, 5, 10)
- Each cron processes its shard

**Effort**: 6-10h

---

# Decision points (defer until needed)

These don't need immediate planning but should be re-evaluated when triggered:

| When | What to decide |
|---|---|
| When approaching 3000 sites | Phase 4.5 sharding cron |
| When first EU enterprise customer asks | Phase 4.1 DPA + audit log review |
| When first non-Italian customer | Phase 4.3 i18n |
| When monthly revenue > €1k | Phase 3.4 audit log + 3.5 2FA become must-have |
| When DB > 1 GB | Re-tune Phase 1.2 retention |

---

# How to use this document

1. **Pick the next item from the highest-priority phase that has all dependencies met**
2. **Mark `[x]` when DONE in production**
3. **Update effort estimates if reality differs by >50%**
4. **Add new items to the relevant phase** (don't create floating todos)
5. **Re-prioritize when business reality changes** (e.g., a customer specifically asks for X)

---

# Quick reference: file conventions

| Domain | Location |
|---|---|
| API routes | `src/app/api/**/route.ts` |
| Server libs | `src/lib/{billing,auth,monitoring,...}/*.ts` |
| Migrations | `supabase/migrations/NNN_name.sql` |
| One-off scripts | `scripts/*.ts` (run via `npx tsx`) |
| New Components | `src/components/**/*.tsx` |
| Email templates | `src/lib/email/templates/*.tsx` (React, used by both nodemailer and Resend) |
| Type definitions | `src/types/*.ts` |
