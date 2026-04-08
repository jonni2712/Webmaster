import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Fixed-window rate limiter backed by Postgres (via Supabase).
 *
 * Each call to `checkRateLimit()` performs two round trips:
 *   1. COUNT attempts for `key` within the window
 *   2. INSERT a new attempt row (only if under the limit)
 *
 * This is adequate for low-volume, high-sensitivity endpoints
 * (auth routes, password reset, etc.). Not suited for hot paths.
 *
 * Cleanup of old rows is handled by the cleanup cron via the
 * `cleanup_rate_limit_attempts()` SQL function.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Requests used within the current window. */
  used: number;
  /** Requests allowed within the window. */
  limit: number;
  /** Seconds until the earliest attempt ages out of the window. */
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  /** Logical name of the limit (e.g. "register", "login"). */
  name: string;
  /** Stable per-identity suffix (e.g. ip address or email). */
  identifier: string;
  /** Maximum allowed requests in the window. */
  max: number;
  /** Window size in seconds. */
  windowSeconds: number;
}

/**
 * Checks and records a rate-limited attempt.
 *
 * Fails open: if the database is unreachable or errors, the request
 * is allowed through and the failure is logged. We prefer availability
 * over false positives during a DB outage.
 */
export async function checkRateLimit(
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const key = `${opts.name}:${opts.identifier}`;
  const windowMs = opts.windowSeconds * 1000;
  const since = new Date(Date.now() - windowMs);

  const supabase = createAdminClient();

  try {
    // Count attempts in the current window.
    const { count, error: countError } = await supabase
      .from('rate_limit_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('key', key)
      .gte('created_at', since.toISOString());

    if (countError) {
      console.error('[rate-limit] count failed, failing open:', countError);
      return {
        allowed: true,
        used: 0,
        limit: opts.max,
        retryAfterSeconds: 0,
      };
    }

    const used = count ?? 0;

    if (used >= opts.max) {
      // Compute retry-after from the oldest attempt in the window.
      const { data: oldest } = await supabase
        .from('rate_limit_attempts')
        .select('created_at')
        .eq('key', key)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      let retryAfterSeconds = opts.windowSeconds;
      if (oldest?.created_at) {
        const oldestTime = new Date(oldest.created_at).getTime();
        retryAfterSeconds = Math.max(
          1,
          Math.ceil((oldestTime + windowMs - Date.now()) / 1000)
        );
      }

      return {
        allowed: false,
        used,
        limit: opts.max,
        retryAfterSeconds,
      };
    }

    // Record the new attempt.
    const { error: insertError } = await supabase
      .from('rate_limit_attempts')
      .insert({ key });

    if (insertError) {
      console.error('[rate-limit] insert failed, failing open:', insertError);
    }

    return {
      allowed: true,
      used: used + 1,
      limit: opts.max,
      retryAfterSeconds: 0,
    };
  } catch (err) {
    console.error('[rate-limit] unexpected error, failing open:', err);
    return {
      allowed: true,
      used: 0,
      limit: opts.max,
      retryAfterSeconds: 0,
    };
  }
}

/**
 * Extracts the client IP from a Next.js request.
 *
 * Vercel sets x-forwarded-for with a comma-separated list where the
 * first entry is the real client. Falls back to x-real-ip and finally
 * to a literal "unknown" so we never throw.
 */
export function getClientIp(request: NextRequest | Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();
  return 'unknown';
}

/**
 * Common limit presets for auth-related endpoints.
 * Values are intentionally conservative to prevent abuse without
 * frustrating legitimate users who retry on typos.
 */
export const AUTH_RATE_LIMITS = {
  // Register: max 3 new signups per IP in 10 minutes.
  register: { max: 3, windowSeconds: 600 },
  // Login: max 10 attempts per IP in 10 minutes (NextAuth handles the actual
  // check, we wrap the authorize() function for per-email protection).
  login: { max: 10, windowSeconds: 600 },
  // Login per-email: max 5 attempts per account in 10 minutes — prevents
  // targeted brute-force against a single account.
  loginEmail: { max: 5, windowSeconds: 600 },
  // Forgot password: max 3 per IP and 2 per email in 10 minutes.
  forgotPasswordIp: { max: 3, windowSeconds: 600 },
  forgotPasswordEmail: { max: 2, windowSeconds: 600 },
  // Resend verification: max 3 per IP in 10 minutes (already has
  // 2-min per-user cooldown in the route).
  resendVerificationIp: { max: 3, windowSeconds: 600 },
  // Reset password: max 5 per IP in 10 minutes — covers both token
  // guessing and legitimate retries on weak-password rejection.
  resetPasswordIp: { max: 5, windowSeconds: 600 },
} as const;

/**
 * Builds a 429 Response with the standard Retry-After header.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Troppe richieste. Riprova più tardi.',
      retryAfter: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds),
      },
    }
  );
}
