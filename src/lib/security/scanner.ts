/**
 * Security Scanner v1.5.0
 * Calculates security score and analyzes WordPress site security
 */

import type { SecurityScanData, SecurityRecommendation } from '@/types/database';

export interface SecurityScoreBreakdown {
  total: number;
  ssl: number;
  versions: number;
  config: number;
  securityPlugin: number;
}

export interface SecurityScanResult {
  score: SecurityScoreBreakdown;
  data: SecurityScanData;
  recommendations: SecurityRecommendation[];
}

/**
 * Calculate SSL score (max 25 points)
 * - SSL valid: 15 points
 * - HTTPS forced: 7 points
 * - HSTS enabled: 3 points
 */
export function calculateSSLScore(ssl: SecurityScanData['ssl']): number {
  let score = 0;
  if (ssl.valid) score += 15;
  if (ssl.https_forced) score += 7;
  if (ssl.hsts_enabled) score += 3;
  return score;
}

/**
 * Calculate versions score (max 25 points)
 * - WordPress updated: 10 points
 * - Plugins updated: 10 points
 * - Themes updated: 5 points
 */
export function calculateVersionsScore(versions: SecurityScanData['versions']): number {
  let score = 0;
  if (versions.wp_updated) score += 10;
  if (versions.plugins_updated) score += 10;
  if (versions.themes_updated) score += 5;
  return score;
}

/**
 * Calculate configuration score (max 25 points)
 * - Debug disabled: 8 points
 * - File editor disabled: 8 points
 * - Directory listing disabled: 5 points
 * - Non-default table prefix: 4 points
 */
export function calculateConfigScore(config: SecurityScanData['config']): number {
  let score = 0;
  if (config.debug_disabled) score += 8;
  if (config.file_editor_disabled) score += 8;
  if (config.directory_listing_disabled) score += 5;
  if (!config.default_prefix) score += 4;
  return score;
}

/**
 * Calculate security plugin score (max 25 points)
 * - Security plugin installed: 15 points
 * - Security plugin active: 10 points
 */
export function calculateSecurityPluginScore(
  securityPlugin: SecurityScanData['security_plugin']
): number {
  let score = 0;
  if (securityPlugin.installed) score += 15;
  if (securityPlugin.active) score += 10;
  return score;
}

/**
 * Calculate total security score breakdown
 */
export function calculateSecurityScore(data: SecurityScanData): SecurityScoreBreakdown {
  const ssl = calculateSSLScore(data.ssl);
  const versions = calculateVersionsScore(data.versions);
  const config = calculateConfigScore(data.config);
  const securityPlugin = calculateSecurityPluginScore(data.security_plugin);

  return {
    total: ssl + versions + config + securityPlugin,
    ssl,
    versions,
    config,
    securityPlugin,
  };
}

/**
 * Get score rating based on total score
 */
export function getScoreRating(score: number): 'critical' | 'poor' | 'fair' | 'good' | 'excellent' {
  if (score < 30) return 'critical';
  if (score < 50) return 'poor';
  if (score < 70) return 'fair';
  if (score < 90) return 'good';
  return 'excellent';
}

/**
 * Get score color for UI display
 */
export function getScoreColor(score: number): string {
  const rating = getScoreRating(score);
  switch (rating) {
    case 'critical':
      return 'text-red-600';
    case 'poor':
      return 'text-orange-600';
    case 'fair':
      return 'text-yellow-600';
    case 'good':
      return 'text-green-600';
    case 'excellent':
      return 'text-emerald-600';
  }
}

/**
 * Get score background color for UI display
 */
export function getScoreBgColor(score: number): string {
  const rating = getScoreRating(score);
  switch (rating) {
    case 'critical':
      return 'bg-red-100 dark:bg-red-900/30';
    case 'poor':
      return 'bg-orange-100 dark:bg-orange-900/30';
    case 'fair':
      return 'bg-yellow-100 dark:bg-yellow-900/30';
    case 'good':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'excellent':
      return 'bg-emerald-100 dark:bg-emerald-900/30';
  }
}

// Helper to safely get nested value
function getNestedValue(
  obj: Record<string, unknown>,
  key: string,
  nestedKey: string,
  defaultValue: unknown
): unknown {
  if (key in obj) return obj[key];
  const nested = obj[nestedKey];
  if (nested && typeof nested === 'object' && key in (nested as Record<string, unknown>)) {
    return (nested as Record<string, unknown>)[key];
  }
  return defaultValue;
}

/**
 * Parse security data from WordPress plugin response
 */
export function parseSecurityData(pluginData: Record<string, unknown>): SecurityScanData {
  const sslData = pluginData.ssl as Record<string, unknown> | undefined;
  const versionsData = pluginData.versions as Record<string, unknown> | undefined;
  const configData = pluginData.config as Record<string, unknown> | undefined;
  const securityPluginData = pluginData.security_plugin as Record<string, unknown> | undefined;
  const fileIntegrityData = pluginData.file_integrity as Record<string, unknown> | undefined;

  // Extract SSL data
  const ssl = {
    valid: Boolean(pluginData.ssl_valid ?? sslData?.valid ?? false),
    https_forced: Boolean(pluginData.https_forced ?? sslData?.https_forced ?? false),
    hsts_enabled: Boolean(pluginData.hsts_enabled ?? sslData?.hsts_enabled ?? false),
  };

  // Extract versions data
  const versions = {
    wp_updated: Boolean(pluginData.wp_updated ?? versionsData?.wp_updated ?? false),
    plugins_updated: Boolean(
      pluginData.plugins_updated ?? versionsData?.plugins_updated ?? false
    ),
    themes_updated: Boolean(
      pluginData.themes_updated ?? versionsData?.themes_updated ?? false
    ),
    outdated_count: Number(pluginData.outdated_count ?? versionsData?.outdated_count ?? 0),
  };

  // Extract config data
  const config = {
    debug_disabled: Boolean(
      pluginData.debug_disabled ?? configData?.debug_disabled ?? false
    ),
    file_editor_disabled: Boolean(
      pluginData.file_editor_disabled ?? configData?.file_editor_disabled ?? false
    ),
    directory_listing_disabled: Boolean(
      pluginData.directory_listing_disabled ?? configData?.directory_listing_disabled ?? false
    ),
    default_prefix: Boolean(
      pluginData.default_prefix ?? configData?.default_prefix ?? true
    ),
  };

  // Extract security plugin data
  const security_plugin = {
    installed: Boolean(
      pluginData.security_plugin_installed ?? securityPluginData?.installed ?? false
    ),
    name: (pluginData.security_plugin_name ?? securityPluginData?.name ?? null) as
      | string
      | null,
    active: Boolean(
      pluginData.security_plugin_active ?? securityPluginData?.active ?? false
    ),
  };

  // Extract file integrity data
  const file_integrity = {
    core_files_modified: Number(
      pluginData.core_files_modified ?? fileIntegrityData?.core_files_modified ?? 0
    ),
    suspicious_files: (pluginData.suspicious_files ??
      fileIntegrityData?.suspicious_files ??
      []) as string[],
  };

  return {
    ssl,
    versions,
    config,
    security_plugin,
    file_integrity,
  };
}

/**
 * Generate mock security data for testing or when plugin data unavailable
 */
export function generateMockSecurityData(): SecurityScanData {
  return {
    ssl: {
      valid: true,
      https_forced: Math.random() > 0.3,
      hsts_enabled: Math.random() > 0.5,
    },
    versions: {
      wp_updated: Math.random() > 0.2,
      plugins_updated: Math.random() > 0.4,
      themes_updated: Math.random() > 0.3,
      outdated_count: Math.floor(Math.random() * 5),
    },
    config: {
      debug_disabled: Math.random() > 0.3,
      file_editor_disabled: Math.random() > 0.5,
      directory_listing_disabled: Math.random() > 0.4,
      default_prefix: Math.random() > 0.6,
    },
    security_plugin: {
      installed: Math.random() > 0.4,
      name: Math.random() > 0.5 ? 'Wordfence Security' : null,
      active: Math.random() > 0.5,
    },
    file_integrity: {
      core_files_modified: Math.floor(Math.random() * 3),
      suspicious_files: [],
    },
  };
}

/**
 * Known security plugins for WordPress
 */
export const KNOWN_SECURITY_PLUGINS = [
  'wordfence',
  'sucuri-scanner',
  'ithemes-security',
  'all-in-one-wp-security-and-firewall',
  'defender-security',
  'jetpack',
  'security-ninja',
  'bulletproof-security',
  'cerber-security',
  'wp-security-audit-log',
];
