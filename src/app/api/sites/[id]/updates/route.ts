import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import type { WPUpdate, UpdateType, UpdateStatus } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const type = searchParams.get('type') as UpdateType | null;
  const status = searchParams.get('status') as UpdateStatus | null;
  const critical = searchParams.get('critical');
  const limit = parseInt(searchParams.get('limit') || '100');

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
      .select('id, name, platform')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('wp_updates')
      .select('*')
      .eq('site_id', id)
      .order('is_critical', { ascending: false })
      .order('update_type')
      .order('name')
      .limit(limit);

    // Apply filters
    if (type) {
      query = query.eq('update_type', type);
    }

    if (status) {
      query = query.eq('status', status);
    } else {
      // Default to available updates only
      query = query.eq('status', 'available');
    }

    if (critical === 'true') {
      query = query.eq('is_critical', true);
    } else if (critical === 'false') {
      query = query.eq('is_critical', false);
    }

    const { data: updates, error } = await query;

    if (error) {
      console.error('Error fetching updates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate summary
    const summary = {
      total: updates?.length || 0,
      critical: updates?.filter(u => u.is_critical).length || 0,
      byType: {
        core: updates?.filter(u => u.update_type === 'core').length || 0,
        plugin: updates?.filter(u => u.update_type === 'plugin').length || 0,
        theme: updates?.filter(u => u.update_type === 'theme').length || 0,
      },
    };

    return NextResponse.json({
      updates: updates as WPUpdate[],
      summary,
      site: {
        id: site.id,
        name: site.name,
        platform: site.platform,
      },
    });
  } catch (error) {
    console.error('GET /api/sites/[id]/updates error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
