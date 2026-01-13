import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/sites/[id]/updates/cleanup
 * Cleans up duplicate update records for a site, keeping only the most recent
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: siteId } = await params;

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
      .select('id')
      .eq('id', siteId)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get all updates for this site
    const { data: allUpdates } = await supabase
      .from('wp_updates')
      .select('id, update_type, slug, new_version, status, checked_at')
      .eq('site_id', siteId)
      .order('checked_at', { ascending: false });

    if (!allUpdates || allUpdates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No updates to clean up',
        deleted: 0
      });
    }

    // Find duplicates: group by update_type + slug + new_version + status
    const seen = new Map<string, string>(); // key -> id (first/most recent occurrence)
    const duplicateIds: string[] = [];

    for (const update of allUpdates) {
      const key = `${update.update_type}:${update.slug}:${update.new_version}:${update.status}`;

      if (seen.has(key)) {
        // This is a duplicate, mark for deletion
        duplicateIds.push(update.id);
      } else {
        // Keep the first (most recent) occurrence
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

    console.log(`Cleaned up ${duplicateIds.length} duplicate update records for site ${siteId}`);

    return NextResponse.json({
      success: true,
      message: `Removed ${duplicateIds.length} duplicate records`,
      deleted: duplicateIds.length,
      remaining: allUpdates.length - duplicateIds.length,
    });
  } catch (error) {
    console.error('POST /api/sites/[id]/updates/cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
