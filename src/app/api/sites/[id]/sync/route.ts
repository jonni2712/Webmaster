import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { processWordPressUpdates } from '@/lib/updates/processor';

interface WordPressStatus {
  plugin_version: string;
  timestamp: string;
  server: {
    php: {
      version: string;
      memory_limit: string;
      max_execution_time: string;
      upload_max_filesize: string;
      post_max_size: string;
      extensions: Record<string, boolean>;
    };
    database: {
      type: string;
      version: string;
      charset: string;
      total_size: string;
      total_size_bytes: number;
      tables_count: number;
    };
    server: {
      software: string;
      web_server: string;
      os: string;
      hostname: string;
      https: boolean;
    };
    disk: {
      total: string;
      free: string;
      used: string;
      used_percentage: number;
      wordpress_size: string;
      uploads_size: string;
    };
  };
  wordpress: {
    core: {
      version: string;
      update_available: boolean;
      latest_version: string;
      site_url: string;
      home_url: string;
      language: string;
    };
    plugins: {
      total: number;
      active: number;
      inactive: number;
      updates_available: number;
      list: Array<{
        name: string;
        slug: string;
        version: string;
        active: boolean;
        update_available: boolean;
        new_version: string;
      }>;
    };
    themes: {
      total: number;
      updates_available: number;
      active: {
        name: string;
        version: string;
        is_child: boolean;
      };
      list: Array<{
        name: string;
        slug: string;
        version: string;
        active: boolean;
        update_available: boolean;
      }>;
    };
    site_health: {
      status: string;
    };
  };
}

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

    if (!site.api_key_encrypted) {
      return NextResponse.json(
        { error: 'API key non configurata per questo sito' },
        { status: 400 }
      );
    }

    // Build the WordPress REST API URL
    const siteUrl = site.url.replace(/\/$/, '');
    const apiUrl = `${siteUrl}/wp-json/webmaster-monitor/v1/status`;

    // Fetch data from WordPress plugin
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-WM-API-Key': site.api_key_encrypted,
        'User-Agent': 'Webmaster-Monitor/1.0',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: 'API Key non valida o scaduta' },
          { status: 401 }
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Plugin Webmaster Monitor non trovato. Assicurati che sia installato e attivato.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Errore dalla API WordPress: ${response.status}` },
        { status: response.status }
      );
    }

    const wpData: WordPressStatus = await response.json();

    // Store the synced data in database
    const { error: updateError } = await supabase
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
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating site data:', updateError);
    }

    // Process WordPress updates into wp_updates table
    if (wpData.wordpress) {
      try {
        const updateResult = await processWordPressUpdates({
          siteId: id,
          tenantId: user.current_tenant_id,
          wpData: {
            core: wpData.wordpress.core,
            plugins: wpData.wordpress.plugins,
            themes: wpData.wordpress.themes,
          },
        });
        console.log(`Processed ${updateResult.processed} updates (${updateResult.critical} critical) for site ${id}`);
      } catch (updateError) {
        console.error('Error processing WordPress updates:', updateError);
        // Don't fail the sync if update processing fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronizzazione completata',
      data: wpData,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('POST /api/sites/[id]/sync error:', error);

    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Timeout: il sito non risponde entro 30 secondi' },
          { status: 504 }
        );
      }
      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'Impossibile connettersi al sito. Verifica che sia raggiungibile.' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Errore durante la sincronizzazione' },
      { status: 500 }
    );
  }
}

// GET endpoint to check connection without storing data
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

    // Get site
    const { data: site } = await supabase
      .from('sites')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (!site.api_key_encrypted) {
      return NextResponse.json(
        { error: 'API key non configurata' },
        { status: 400 }
      );
    }

    // Test connection with ping endpoint
    const siteUrl = site.url.replace(/\/$/, '');
    const pingUrl = `${siteUrl}/wp-json/webmaster-monitor/v1/ping`;

    const response = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'X-WM-API-Key': site.api_key_encrypted,
        'User-Agent': 'Webmaster-Monitor/1.0',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout for ping
    });

    if (!response.ok) {
      return NextResponse.json(
        { connected: false, error: `Errore: ${response.status}` },
        { status: 200 }
      );
    }

    const pingData = await response.json();

    return NextResponse.json({
      connected: true,
      plugin_version: pingData.plugin_version,
      site_url: pingData.site_url,
      message: pingData.message,
    });
  } catch (error) {
    console.error('GET /api/sites/[id]/sync error:', error);
    return NextResponse.json(
      { connected: false, error: 'Impossibile connettersi al sito' },
      { status: 200 }
    );
  }
}
