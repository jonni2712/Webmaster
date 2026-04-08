/**
 * URL helpers — centralize base URL construction so that one
 * misconfigured env var (e.g. trailing slash) can't cause broken
 * links across the entire app.
 */

const DEFAULT_APP_URL = 'https://webmaster-monitor.it';

/**
 * Returns the canonical application base URL, WITHOUT trailing slash.
 *
 * Precedence:
 *   1. NEXTAUTH_URL
 *   2. NEXT_PUBLIC_APP_URL
 *   3. DEFAULT_APP_URL constant
 *
 * Trailing slashes are stripped in all cases, so callers can always
 * safely do `${getAppBaseUrl()}/path` without worrying about doubles.
 */
export function getAppBaseUrl(): string {
  const raw =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_APP_URL;
  return raw.replace(/\/+$/, '');
}

/**
 * Builds an absolute URL for a given path.
 * The path may start with or without a leading slash.
 */
export function absoluteUrl(path: string): string {
  const base = getAppBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
