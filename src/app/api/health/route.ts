import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import nodemailer from 'nodemailer';

/**
 * Public health check endpoint.
 *
 * Returns 200 if all dependencies are reachable, 503 otherwise.
 * No authentication required — meant for external monitors (e.g. the
 * platform monitoring itself, or an external uptime service).
 *
 * Checks performed:
 *   - db:    `SELECT 1` via Supabase admin client
 *   - smtp:  nodemailer `verify()` against SMTP_HOST (if configured)
 *
 * Results are cached in-memory for 60 seconds to avoid hammering
 * Supabase/SMTP on every health probe.
 */

export const maxDuration = 15;

interface CheckResult {
  ok: boolean;
  latency_ms: number;
  error?: string;
}

interface HealthCache {
  timestamp: number;
  body: {
    status: 'ok' | 'degraded' | 'fail';
    checks: Record<string, CheckResult>;
    version: string;
  };
  httpStatus: number;
}

let cache: HealthCache | null = null;
const CACHE_TTL_MS = 60_000;

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    if (error) {
      return { ok: false, latency_ms: Date.now() - start, error: error.message };
    }
    return { ok: true, latency_ms: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkSmtp(): Promise<CheckResult> {
  const start = Date.now();
  const host = process.env.SMTP_HOST;

  if (!host) {
    // SMTP is optional (Resend fallback exists), so not configured = OK.
    return { ok: true, latency_ms: 0, error: 'not_configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' ||
              process.env.SMTP_SECURE === '1' ||
              process.env.SMTP_PORT === '465',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
      connectionTimeout: 8000,
    });
    await transporter.verify();
    return { ok: true, latency_ms: Date.now() - start };
  } catch (err) {
    return {
      ok: false,
      latency_ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET() {
  // Serve from cache if fresh.
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cache.body, {
      status: cache.httpStatus,
      headers: {
        'Cache-Control': 'no-store',
        'X-Health-Cache': 'hit',
      },
    });
  }

  const [db, smtp] = await Promise.all([checkDatabase(), checkSmtp()]);

  const checks = { db, smtp };
  const allOk = Object.values(checks).every((c) => c.ok);
  const httpStatus = allOk ? 200 : 503;

  const body = {
    status: allOk ? ('ok' as const) : ('fail' as const),
    checks,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  };

  cache = { timestamp: Date.now(), body, httpStatus };

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store',
      'X-Health-Cache': 'miss',
    },
  });
}
