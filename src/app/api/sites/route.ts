import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { processWordPressUpdates } from '@/lib/updates/processor';
import { getSiteAccessFilter } from '@/lib/supabase/helpers';
import { logActivity } from '@/lib/activity/logger';
import { encrypt } from '@/lib/crypto';
import { assertCanAddSite, PlanLimitError } from '@/lib/billing/limits';
import { z } from 'zod';

const siteSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  platform: z.enum(['wordpress', 'prestashop', 'nextjs', 'other']),
  client_id: z.string().uuid().optional().nullable(),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  ssl_check_enabled: z.boolean().optional().default(true),
  uptime_check_enabled: z.boolean().optional().default(true),
  performance_check_enabled: z.boolean().optional().default(true),
  updates_check_enabled: z.boolean().optional().default(true),
  ecommerce_check_enabled: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  // Domain management fields
  server_id: z.string().uuid().optional().nullable(),
  lifecycle_status: z.enum([
    'active', 'to_update', 'to_rebuild', 'in_maintenance',
    'in_progress', 'to_delete', 'redirect_only', 'archived'
  ]).optional().default('active'),
  redirect_to_site_id: z.string().uuid().optional().nullable(),
  redirect_type: z.enum(['301', '302', '307', '308', 'meta', 'js']).optional().nullable(),
  is_redirect_source: z.boolean().optional().default(false),
  domain_expires_at: z.string().datetime().optional().nullable(),
  domain_registrar: z.string().optional().nullable(),
  domain_notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const platform = searchParams.get('platform');
  const search = searchParams.get('search');

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

  // Get site access filter for member/viewer roles
  const siteAccessFilter = await getSiteAccessFilter(session.user.id, user.current_tenant_id);

  let query = supabase
    .from('sites')
    .select('id, name, url, platform, tenant_id, client_id, is_active, tags, created_at, status, ssl_status, ssl_expires_at, uptime_percentage, response_time_avg, last_check, last_sync, performance_score, server_id, lifecycle_status, redirect_to_site_id, is_redirect_source, domain_expires_at, parent_site_id, is_multisite, is_main_site, notes', { count: 'exact' })
    .eq('tenant_id', user.current_tenant_id);

  // Apply site access filter for non-admin users
  if (siteAccessFilter !== null) {
    if (siteAccessFilter.length === 0) {
      // User has no site access - return empty result
      return NextResponse.json({
        sites: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }
    query = query.in('id', siteAccessFilter);
  }

  if (platform) {
    query = query.eq('platform', platform);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,url.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order('name')
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map sites to expected frontend format
  const mappedSites = (data || []).map(site => ({
    ...site,
    status: site.status || 'unknown',
    ssl_status: site.ssl_status || null,
    ssl_expiry: site.ssl_expires_at || null,
    uptime_percentage: site.uptime_percentage || null,
    response_time_avg: site.response_time_avg || null,
    last_check: site.last_check || site.last_sync || null,
  }));

  return NextResponse.json({
    sites: mappedSites,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = siteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get user's current tenant and verify they have permission
    const { data: userTenant } = await supabase
      .from('users')
      .select(`
        current_tenant_id,
        user_tenants!inner(role)
      `)
      .eq('id', session.user.id)
      .eq('user_tenants.tenant_id', supabase.rpc('current_tenant_id'))
      .single();

    // Fallback: get tenant directly
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check user role in tenant
    const { data: membership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per aggiungere siti' },
        { status: 403 }
      );
    }

    // Enforce plan limit on number of sites.
    try {
      await assertCanAddSite(user.current_tenant_id);
    } catch (err) {
      if (err instanceof PlanLimitError) {
        return NextResponse.json(
          {
            error: `Limite del piano raggiunto: ${err.current}/${err.max} siti. Aggiorna il piano per aggiungerne di più.`,
            code: 'PLAN_LIMIT_REACHED',
            limit: { current: err.current, max: err.max, kind: err.kind },
          },
          { status: 403 }
        );
      }
      throw err;
    }

    const {
      api_key,
      api_secret,
      client_id,
      server_id,
      redirect_to_site_id,
      domain_expires_at,
      ...siteData
    } = validation.data;

    // Verify server belongs to tenant if provided
    if (server_id) {
      const { data: server } = await supabase
        .from('servers')
        .select('id')
        .eq('id', server_id)
        .eq('tenant_id', user.current_tenant_id)
        .single();

      if (!server) {
        return NextResponse.json(
          { error: 'Server non trovato' },
          { status: 404 }
        );
      }
    }

    // Verify redirect target belongs to tenant if provided
    if (redirect_to_site_id) {
      const { data: targetSite } = await supabase
        .from('sites')
        .select('id')
        .eq('id', redirect_to_site_id)
        .eq('tenant_id', user.current_tenant_id)
        .single();

      if (!targetSite) {
        return NextResponse.json(
          { error: 'Sito di destinazione redirect non trovato' },
          { status: 404 }
        );
      }
    }

    const { data, error } = await supabase
      .from('sites')
      .insert({
        ...siteData,
        tenant_id: user.current_tenant_id,
        client_id: client_id || null,
        server_id: server_id || null,
        redirect_to_site_id: redirect_to_site_id || null,
        domain_expires_at: domain_expires_at || null,
        api_key_encrypted: encrypt(api_key),
        api_secret_encrypted: encrypt(api_secret),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Un sito con questo URL esiste gia' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await logActivity({
      tenantId: user.current_tenant_id,
      userId: session.user.id,
      actionType: 'site_created',
      resourceType: 'site',
      resourceId: data.id,
      resourceName: data.name,
    });

    // Auto-sync if WordPress site with API key
    if (data && data.platform === 'wordpress' && api_key) {
      // Run sync in background (don't wait for it)
      syncWordPressSite(data.id, data.url, api_key, user.current_tenant_id).catch(err => {
        console.error('Auto-sync error for new site:', err);
      });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST /api/sites error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

/**
 * Auto-sync WordPress site after creation
 */
async function syncWordPressSite(
  siteId: string,
  siteUrl: string,
  apiKey: string,
  tenantId: string
) {
  try {
    const url = siteUrl.replace(/\/$/, '');
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
      console.log(`Auto-sync failed for site ${siteId}: HTTP ${response.status}`);
      return;
    }

    const wpData = await response.json();
    const supabase = createAdminClient();

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
      .eq('id', siteId);

    // Process updates
    if (wpData.wordpress) {
      await processWordPressUpdates({
        siteId,
        tenantId,
        wpData: {
          core: wpData.wordpress.core,
          plugins: wpData.wordpress.plugins,
          themes: wpData.wordpress.themes,
        },
      });
    }

    console.log(`Auto-sync completed for new site ${siteId}`);
  } catch (err) {
    console.error(`Auto-sync error for site ${siteId}:`, err);
  }
}
