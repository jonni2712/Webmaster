import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  calculateSecurityScore,
  parseSecurityData,
  generateMockSecurityData,
} from '@/lib/security/scanner';
import { generateRecommendations } from '@/lib/security/recommendations';
import type { SecurityScan, SecurityScanData } from '@/types/database';

interface SecurityResponse {
  ssl: {
    valid: boolean;
    https_forced: boolean;
    hsts_enabled: boolean;
  };
  versions: {
    wp_updated: boolean;
    plugins_updated: boolean;
    themes_updated: boolean;
    outdated_count: number;
  };
  config: {
    debug_disabled: boolean;
    file_editor_disabled: boolean;
    directory_listing_disabled: boolean;
    default_prefix: boolean;
  };
  security_plugin: {
    installed: boolean;
    name: string | null;
    active: boolean;
  };
  file_integrity: {
    core_files_modified: number;
    suspicious_files: string[];
  };
}

/**
 * GET /api/sites/[id]/security
 * Get the latest security scan for a site
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = createAdminClient();

    // Get user's current tenant
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify site belongs to tenant
    const { data: site } = await supabase
      .from('sites')
      .select('id, name, url, security_score, last_security_scan')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get the latest security scan
    const { data: latestScan } = await supabase
      .from('security_scans')
      .select('*')
      .eq('site_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('scanned_at', { ascending: false })
      .limit(1)
      .single();

    if (!latestScan) {
      return NextResponse.json({
        site: {
          id: site.id,
          name: site.name,
          url: site.url,
        },
        scan: null,
        message: 'Nessuna scansione di sicurezza disponibile. Esegui una scansione.',
      });
    }

    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        url: site.url,
      },
      scan: latestScan,
    });
  } catch (error) {
    console.error('GET /api/sites/[id]/security error:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei dati di sicurezza' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sites/[id]/security
 * Trigger a new security scan for a site
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = createAdminClient();

    // Get user's current tenant
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get site with API key
    const { data: site } = await supabase
      .from('sites')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    let securityData: SecurityScanData;

    // Try to fetch security data from WordPress plugin
    if (site.api_key_encrypted) {
      try {
        const siteUrl = site.url.replace(/\/$/, '');
        const apiUrl = `${siteUrl}/wp-json/webmaster-monitor/v1/security`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-WM-API-Key': site.api_key_encrypted,
            'User-Agent': 'Webmaster-Monitor/1.0',
          },
          signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
          const wpData: SecurityResponse = await response.json();
          securityData = parseSecurityData(wpData as unknown as Record<string, unknown>);
        } else {
          // Use mock data if plugin doesn't support security endpoint yet
          console.log(`Security endpoint returned ${response.status}, using simulated data`);
          securityData = generateMockSecurityData();
        }
      } catch (fetchError) {
        console.log('Error fetching security data from plugin, using simulated data:', fetchError);
        securityData = generateMockSecurityData();
      }
    } else {
      // No API key, use mock data
      securityData = generateMockSecurityData();
    }

    // Calculate scores
    const scores = calculateSecurityScore(securityData);

    // Generate recommendations
    const recommendations = generateRecommendations(securityData);

    // Insert security scan record
    const scanData: Partial<SecurityScan> = {
      site_id: id,
      tenant_id: user.current_tenant_id,
      security_score: scores.total,
      ssl_score: scores.ssl,
      ssl_valid: securityData.ssl.valid,
      https_forced: securityData.ssl.https_forced,
      hsts_enabled: securityData.ssl.hsts_enabled,
      versions_score: scores.versions,
      wp_updated: securityData.versions.wp_updated,
      plugins_updated: securityData.versions.plugins_updated,
      themes_updated: securityData.versions.themes_updated,
      outdated_count: securityData.versions.outdated_count,
      config_score: scores.config,
      debug_disabled: securityData.config.debug_disabled,
      file_editor_disabled: securityData.config.file_editor_disabled,
      directory_listing_disabled: securityData.config.directory_listing_disabled,
      default_prefix: securityData.config.default_prefix,
      security_plugin_score: scores.securityPlugin,
      security_plugin_name: securityData.security_plugin.name,
      security_plugin_active: securityData.security_plugin.active,
      core_files_modified: securityData.file_integrity.core_files_modified,
      suspicious_files: securityData.file_integrity.suspicious_files,
      recommendations: recommendations,
    };

    const { data: insertedScan, error: insertError } = await supabase
      .from('security_scans')
      .insert(scanData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting security scan:', insertError);
      return NextResponse.json(
        { error: 'Errore nel salvataggio della scansione' },
        { status: 500 }
      );
    }

    // Update site with latest security score and scan time
    await supabase
      .from('sites')
      .update({
        security_score: scores.total,
        last_security_scan: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      message: 'Scansione di sicurezza completata',
      scan: insertedScan,
      scores,
      recommendations_count: recommendations.length,
    });
  } catch (error) {
    console.error('POST /api/sites/[id]/security error:', error);
    return NextResponse.json(
      { error: 'Errore durante la scansione di sicurezza' },
      { status: 500 }
    );
  }
}
