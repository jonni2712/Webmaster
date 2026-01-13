import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/updates/cleanup
 * Cleans up duplicate update records for ALL sites of the current tenant
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

    // Get all site IDs for this tenant
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('tenant_id', user.current_tenant_id);

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sites found',
        totalDeleted: 0
      });
    }

    const siteIds = sites.map(s => s.id);

    // Get all updates for all sites of this tenant
    const { data: allUpdates } = await supabase
      .from('wp_updates')
      .select('id, site_id, update_type, slug, new_version, status, checked_at')
      .in('site_id', siteIds)
      .order('checked_at', { ascending: false });

    if (!allUpdates || allUpdates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No updates to clean up',
        totalDeleted: 0
      });
    }

    // Find duplicates: group by site_id + update_type + slug + new_version + status
    const seen = new Map<string, string>();
    const duplicateIds: string[] = [];

    for (const update of allUpdates) {
      const key = `${update.site_id}:${update.update_type}:${update.slug}:${update.new_version}:${update.status}`;

      if (seen.has(key)) {
        duplicateIds.push(update.id);
      } else {
        seen.set(key, update.id);
      }
    }

    // Delete duplicates
    if (duplicateIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('wp_updates')
        .delete()
        .in('id', duplicateIds);

      if (deleteError) {
        console.error('Error deleting duplicate updates:', deleteError);
        return NextResponse.json({ error: 'Failed to delete duplicates' }, { status: 500 });
      }
    }

    console.log(`Cleaned up ${duplicateIds.length} duplicate update records for tenant ${user.current_tenant_id}`);

    return NextResponse.json({
      success: true,
      message: `Removed ${duplicateIds.length} duplicate records across ${sites.length} sites`,
      totalDeleted: duplicateIds.length,
      totalRemaining: allUpdates.length - duplicateIds.length,
      sitesProcessed: sites.length,
    });
  } catch (error) {
    console.error('POST /api/updates/cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
