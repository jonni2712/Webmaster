import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/sites/debug
 * Shows raw site data for debugging
 */
export async function GET(request: NextRequest) {
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

    // Get all sites with ALL columns
    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .eq('tenant_id', user.current_tenant_id);

    // Get update counts
    const siteIds = sites?.map(s => s.id) || [];
    const { data: updateCounts } = await supabase
      .from('wp_updates')
      .select('site_id, is_critical, status')
      .in('site_id', siteIds);

    // Group update counts
    const updatesBySite: Record<string, { available: number; applied: number; critical: number }> = {};
    for (const update of updateCounts || []) {
      if (!updatesBySite[update.site_id]) {
        updatesBySite[update.site_id] = { available: 0, applied: 0, critical: 0 };
      }
      if (update.status === 'available') {
        updatesBySite[update.site_id].available++;
        if (update.is_critical) updatesBySite[update.site_id].critical++;
      } else {
        updatesBySite[update.site_id].applied++;
      }
    }

    // Return site data with relevant fields
    const sitesDebug = (sites || []).map(s => ({
      id: s.id,
      name: s.name,
      platform: s.platform,
      // Check for any field that might have "20"
      allNumericFields: Object.entries(s)
        .filter(([k, v]) => typeof v === 'number')
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
      updateCounts: updatesBySite[s.id] || { available: 0, applied: 0, critical: 0 },
    }));

    return NextResponse.json({
      sites: sitesDebug,
      rawUpdateCounts: updateCounts,
    });
  } catch (error) {
    console.error('GET /api/sites/debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
