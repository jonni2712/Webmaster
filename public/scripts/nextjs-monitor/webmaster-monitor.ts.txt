/**
 * Webmaster Monitor - Next.js Integration Script
 *
 * Questo script raccoglie informazioni dal tuo sito Next.js
 * e le invia alla piattaforma Webmaster Monitor.
 *
 * Installazione:
 * 1. Copia questo file in /lib/webmaster-monitor.ts
 * 2. Copia route.ts in /app/api/webmaster-monitor/status/route.ts
 * 3. Aggiungi le variabili d'ambiente nel tuo .env.local
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import os from 'os';

export interface WebmasterMonitorConfig {
  siteId: string;
  apiKey: string;
  apiUrl?: string;
  customData?: Record<string, unknown>;
}

export interface MonitorStatus {
  framework: {
    name: string;
    version: string | null;
    react_version: string | null;
  };
  node: {
    version: string;
    arch: string;
    platform: string;
  };
  dependencies: {
    total: number;
    production: number;
    dev: number;
    key_packages: Array<{ name: string; version: string }>;
  };
  build: {
    node_env: string;
    build_id: string | null;
    deployment_id: string | null;
  };
  environment: {
    is_production: boolean;
    is_vercel: boolean;
    is_docker: boolean;
    region: string | null;
  };
  server: {
    hostname: string;
    uptime_seconds: number;
    memory: {
      total: string;
      free: string;
      used_percentage: number;
    };
    cpu: {
      model: string;
      cores: number;
      load_avg: number[];
    };
  };
  performance: {
    process_uptime_seconds: number;
    memory_usage_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
  };
  custom?: Record<string, unknown>;
  collected_at: string;
  monitor_version: string;
}

const MONITOR_VERSION = '1.0.0';

/**
 * Raccoglie tutte le informazioni del sito Next.js
 */
export async function collectStatus(
  customChecks?: Record<string, () => Promise<boolean>>,
  customData?: Record<string, unknown>
): Promise<MonitorStatus> {
  const packageJson = getPackageJson();
  const dependencies = packageJson?.dependencies || {};
  const devDependencies = packageJson?.devDependencies || {};

  // Health checks
  const healthChecks: Record<string, boolean> = {
    node_running: true,
    memory_ok: getMemoryUsagePercent() < 90,
  };

  // Run custom health checks
  if (customChecks) {
    for (const [name, check] of Object.entries(customChecks)) {
      try {
        healthChecks[name] = await check();
      } catch {
        healthChecks[name] = false;
      }
    }
  }

  const allChecksPass = Object.values(healthChecks).every(Boolean);
  const someChecksFail = Object.values(healthChecks).some((v) => !v);

  return {
    framework: {
      name: 'next',
      version: dependencies['next'] || null,
      react_version: dependencies['react'] || null,
    },
    node: {
      version: process.version,
      arch: process.arch,
      platform: process.platform,
    },
    dependencies: {
      total: Object.keys(dependencies).length + Object.keys(devDependencies).length,
      production: Object.keys(dependencies).length,
      dev: Object.keys(devDependencies).length,
      key_packages: getKeyPackages(dependencies),
    },
    build: {
      node_env: process.env.NODE_ENV || 'development',
      build_id: process.env.NEXT_BUILD_ID || null,
      deployment_id: process.env.VERCEL_DEPLOYMENT_ID || null,
    },
    environment: {
      is_production: process.env.NODE_ENV === 'production',
      is_vercel: !!process.env.VERCEL,
      is_docker: existsSync('/.dockerenv'),
      region: process.env.VERCEL_REGION || null,
    },
    server: {
      hostname: os.hostname(),
      uptime_seconds: Math.floor(os.uptime()),
      memory: {
        total: formatBytes(os.totalmem()),
        free: formatBytes(os.freemem()),
        used_percentage: getMemoryUsagePercent(),
      },
      cpu: {
        model: os.cpus()[0]?.model || 'unknown',
        cores: os.cpus().length,
        load_avg: os.loadavg(),
      },
    },
    performance: {
      process_uptime_seconds: Math.floor(process.uptime()),
      memory_usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    health: {
      status: allChecksPass ? 'healthy' : someChecksFail ? 'degraded' : 'unhealthy',
      checks: healthChecks,
      timestamp: new Date().toISOString(),
    },
    custom: customData,
    collected_at: new Date().toISOString(),
    monitor_version: MONITOR_VERSION,
  };
}

/**
 * Invia lo stato alla piattaforma Webmaster Monitor
 */
export async function sendStatus(
  config: WebmasterMonitorConfig,
  customChecks?: Record<string, () => Promise<boolean>>
): Promise<{ success: boolean; error?: string }> {
  const apiUrl = config.apiUrl || 'https://webmaster-monitor.com';

  try {
    const status = await collectStatus(customChecks, config.customData);

    const response = await fetch(
      `${apiUrl}/api/sites/${config.siteId}/nextjs/status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WM-API-Key': config.apiKey,
          'User-Agent': `WebmasterMonitor-NextJS/${MONITOR_VERSION}`,
        },
        body: JSON.stringify(status),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Crea un handler per l'API route di Next.js
 */
export function createStatusHandler(
  config: WebmasterMonitorConfig,
  customChecks?: Record<string, () => Promise<boolean>>
) {
  return async function handler(request: Request) {
    // Verifica API key per richieste esterne
    const authHeader = request.headers.get('x-wm-api-key');

    // Permetti richieste dalla piattaforma o con API key valida
    if (authHeader && authHeader !== config.apiKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const status = await collectStatus(customChecks, config.customData);

      return new Response(JSON.stringify(status), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Failed to collect status',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

// Helper functions

function getPackageJson(): Record<string, unknown> | null {
  try {
    const packagePath = join(process.cwd(), 'package.json');
    if (existsSync(packagePath)) {
      return JSON.parse(readFileSync(packagePath, 'utf-8'));
    }
  } catch {
    // Ignore errors
  }
  return null;
}

function getKeyPackages(
  dependencies: Record<string, string>
): Array<{ name: string; version: string }> {
  const keyPackageNames = [
    'next',
    'react',
    'react-dom',
    'typescript',
    '@prisma/client',
    'drizzle-orm',
    'mongoose',
    '@supabase/supabase-js',
    'tailwindcss',
    '@tanstack/react-query',
    'zustand',
    'next-auth',
    '@clerk/nextjs',
    'stripe',
  ];

  return keyPackageNames
    .filter((name) => dependencies[name])
    .map((name) => ({
      name,
      version: dependencies[name].replace(/^\^|~/, ''),
    }));
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function getMemoryUsagePercent(): number {
  const total = os.totalmem();
  const free = os.freemem();
  return Math.round(((total - free) / total) * 100);
}

export default {
  collectStatus,
  sendStatus,
  createStatusHandler,
  MONITOR_VERSION,
};
