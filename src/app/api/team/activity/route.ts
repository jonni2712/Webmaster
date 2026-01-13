import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ActivityLog } from '@/types/database';

// GET /api/team/activity - Get activity log with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const actionType = searchParams.get('action_type');
    const resourceType = searchParams.get('resource_type');
    const userId = searchParams.get('user_id');

    const supabase = createAdminClient();

    // Get user's tenant
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('activity_logs')
      .select(`
        id,
        tenant_id,
        user_id,
        action_type,
        resource_type,
        resource_id,
        resource_name,
        target_user_id,
        target_user_email,
        metadata,
        ip_address,
        created_at,
        user:user_id (
          name,
          email
        )
      `, { count: 'exact' })
      .eq('tenant_id', user.current_tenant_id);

    // Apply filters
    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Get paginated results
    const { data: activities, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return NextResponse.json({ error: 'Errore nel recupero attivita' }, { status: 500 });
    }

    // Transform to ActivityLog format
    const formattedActivities: ActivityLog[] = (activities || []).map(activity => ({
      id: activity.id,
      tenant_id: activity.tenant_id,
      user_id: activity.user_id,
      user_name: (activity.user as any)?.name || null,
      user_email: (activity.user as any)?.email || '',
      action_type: activity.action_type,
      resource_type: activity.resource_type,
      resource_id: activity.resource_id,
      resource_name: activity.resource_name,
      target_user_id: activity.target_user_id,
      target_user_email: activity.target_user_email,
      metadata: activity.metadata,
      ip_address: activity.ip_address,
      created_at: activity.created_at,
    }));

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/team/activity:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
