import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { processWordPressUpdates } from '@/lib/updates/processor';
import { decrypt } from '@/lib/crypto';

/**
 * POST /api/sites/sync-all
 * Synchronizes all WordPress sites with API keys for the current tenant
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    // Get all WordPress sites with API keys
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name, url, api_key_encrypted, platform')
      .eq('tenant_id', user.current_tenant_id)
      .eq('platform', 'wordpress')
      .not('api_key_encrypted', 'is', null);

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nessun sito WordPress con API key trovato',
        synced: 0,
        failed: 0,
        results: [],
      });
    }

    // Sync all sites in parallel
    const results = await Promise.allSettled(
      sites.map(site => syncSite(site, user.current_tenant_id, supabase))
    );

    // Count successes and failures
    const syncResults = results.map((result, index) => {
      const site = sites[index];
      if (result.status === 'fulfilled') {
        return {
          siteId: site.id,
          siteName: site.name,
          success: result.value.success,
          message: result.value.message,
          updates: result.value.updates,
        };
      } else {
        return {
          siteId: site.id,
          siteName: site.name,
          success: false,
          message: result.reason?.message || 'Errore sconosciuto',
          updates: 0,
        };
      }
    });

    const synced = syncResults.filter(r => r.success).length;
    const failed = syncResults.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sincronizzati ${synced} siti su ${sites.length}`,
      synced,
      failed,
      results: syncResults,
    });
  } catch (error) {
    console.error('POST /api/sites/sync-all error:', error);
    return NextResponse.json(
      { error: 'Errore durante la sincronizzazione' },
      { status: 500 }
    );
  }
}

async function syncSite(
  site: { id: string; name: string; url: string; api_key_encrypted: string | null },
  tenantId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<{ success: boolean; message: string; updates: number }> {
  if (!site.api_key_encrypted) {
    return { success: false, message: 'API key mancante', updates: 0 };
  }

  const apiKey = decrypt(site.api_key_encrypted);
  if (!apiKey) {
    return { success: false, message: 'Impossibile decifrare API key', updates: 0 };
  }

  try {
    const url = site.url.replace(/\/$/, '');
    const apiUrl = `${url}/wp-json/webmaster-monitor/v1/status`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-WM-API-Key': apiKey,
        'User-Agent': 'Webmaster-Monitor/1.0',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}`,
        updates: 0
      };
    }

    const wpData = await response.json();

    // Update site with synced data
    await supabase
      .from('sites')
      .update({
        last_sync: new Date().toISOString(),
        wp_version: wpData.wordpress?.core?.version,
        php_version: wpData.server?.php?.version,
        server_info: {
          php: wpData.server?.php,
          database: wpData.server?.database,
          server: wpData.server?.server,
          disk: wpData.server?.disk,
        },
        wp_info: {
          core: wpData.wordpress?.core,
          plugins: wpData.wordpress?.plugins,
          themes: wpData.wordpress?.themes,
          site_health: wpData.wordpress?.site_health,
        },
        plugin_version: wpData.plugin_version,
        status: 'online',
      })
      .eq('id', site.id);

    // Process updates
    let updatesCount = 0;
    if (wpData.wordpress) {
      const result = await processWordPressUpdates({
        siteId: site.id,
        tenantId,
        wpData: {
          core: wpData.wordpress.core,
          plugins: wpData.wordpress.plugins,
          themes: wpData.wordpress.themes,
        },
      });
      updatesCount = result.processed;
    }

    return {
      success: true,
      message: 'Sincronizzato',
      updates: updatesCount
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return { success: false, message, updates: 0 };
  }
}
