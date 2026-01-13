import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/updates/debug
 * Shows all update records for debugging
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

    // Get all sites for this tenant
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('tenant_id', user.current_tenant_id);

    const siteIds = sites?.map(s => s.id) || [];

    // Get all updates
    const { data: allUpdates } = await supabase
      .from('wp_updates')
      .select('*')
      .in('site_id', siteIds)
      .order('site_id')
      .order('checked_at', { ascending: false });

    // Group by site
    const bySite: Record<string, any[]> = {};
    for (const update of allUpdates || []) {
      const siteName = sites?.find(s => s.id === update.site_id)?.name || update.site_id;
      if (!bySite[siteName]) bySite[siteName] = [];
      bySite[siteName].push({
        id: update.id,
        type: update.update_type,
        slug: update.slug,
        name: update.name,
        current: update.current_version,
        new: update.new_version,
        status: update.status,
        checked_at: update.checked_at,
      });
    }

    return NextResponse.json({
      totalRecords: allUpdates?.length || 0,
      availableCount: allUpdates?.filter(u => u.status === 'available').length || 0,
      bySite,
    });
  } catch (error) {
    console.error('GET /api/updates/debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/updates/debug
 * Deletes ALL update records (nuclear option for cleanup)
 */
export async function DELETE(request: NextRequest) {
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

    // Get all sites for this tenant
    const { data: sites } = await supabase
      .from('sites')
      .select('id')
      .eq('tenant_id', user.current_tenant_id);

    const siteIds = sites?.map(s => s.id) || [];

    // Delete all updates for these sites
    const { error } = await supabase
      .from('wp_updates')
      .delete()
      .in('site_id', siteIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All update records deleted. Do a sync to repopulate.',
    });
  } catch (error) {
    console.error('DELETE /api/updates/debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
