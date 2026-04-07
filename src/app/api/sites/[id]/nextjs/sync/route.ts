import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { userCanAccessSite } from '@/lib/supabase/helpers';
import { decrypt } from '@/lib/crypto';

/**
 * POST /api/sites/[id]/nextjs/sync
 * Fetch status from a Next.js site's monitor endpoint
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

  // Check access
  const hasAccess = await userCanAccessSite(session.user.id, user.current_tenant_id, id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Get site with credentials
  const { data: site } = await supabase
    .from('sites')
    .select('id, url, platform, api_key_encrypted')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  if (site.platform !== 'nextjs') {
    return NextResponse.json({ error: 'Not a Next.js site' }, { status: 400 });
  }

  if (!site.api_key_encrypted) {
    return NextResponse.json(
      { error: 'API key not configured. Install the monitor script on your Next.js site.' },
      { status: 400 }
    );
  }

  const apiKey = decrypt(site.api_key_encrypted);
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Failed to decrypt API key' },
      { status: 500 }
    );
  }

  try {
    // Build the monitor endpoint URL
    const siteUrl = site.url.replace(/\/$/, '');
    const monitorUrl = `${siteUrl}/api/webmaster-monitor/status`;

    // Fetch status from the Next.js site
    const response = await fetch(monitorUrl, {
      method: 'GET',
      headers: {
        'X-WM-API-Key': apiKey,
        'User-Agent': 'Webmaster-Monitor/1.0',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          error: `HTTP ${response.status}${errorText ? `: ${errorText}` : ''}`,
        },
        { status: response.status === 401 ? 401 : 502 }
      );
    }

    const statusData = await response.json();

    // Update site with the received data
    const updateData: Record<string, unknown> = {
      last_sync: new Date().toISOString(),
      status: statusData.health?.status === 'healthy' ? 'online' :
              statusData.health?.status === 'degraded' ? 'degraded' : 'offline',
    };

    // Store Next.js info in wp_info field (reusing for compatibility)
    updateData.wp_info = {
      framework: statusData.framework,
      node: statusData.node,
      dependencies: statusData.dependencies,
      build: statusData.build,
      environment: statusData.environment,
      performance: statusData.performance,
      health: statusData.health,
      custom: statusData.custom,
      monitor_version: statusData.monitor_version,
    };

    // Store server info
    if (statusData.server) {
      updateData.server_info = statusData.server;
    }

    // Update the site
    const { error: updateError } = await supabase
      .from('sites')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating site:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to save status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: statusData,
    });
  } catch (error) {
    console.error('Next.js sync error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's a timeout or network error
    if (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to reach the site. Make sure the monitor script is installed and the site is online.',
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
