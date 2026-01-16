import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/sites/[id]/security/history
 * Get security scan history for a site
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get query params
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

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
      .select('id, name, url')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get security scan history
    const { data: scans, error, count } = await supabase
      .from('security_scans')
      .select('*', { count: 'exact' })
      .eq('site_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('scanned_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching security history:', error);
      return NextResponse.json(
        { error: 'Errore nel recupero dello storico' },
        { status: 500 }
      );
    }

    // Calculate statistics if we have scans
    let stats = null;
    if (scans && scans.length > 0) {
      const scores = scans.map(s => s.security_score);
      const latestScore = scores[0];
      const previousScore = scores.length > 1 ? scores[1] : null;
      const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const trend = previousScore !== null ? latestScore - previousScore : 0;

      // Count improvements/degradations
      let improvements = 0;
      let degradations = 0;
      for (let i = 0; i < scores.length - 1; i++) {
        if (scores[i] > scores[i + 1]) improvements++;
        if (scores[i] < scores[i + 1]) degradations++;
      }

      stats = {
        latest_score: latestScore,
        average_score: averageScore,
        trend,
        improvements,
        degradations,
        total_scans: count || scans.length,
      };
    }

    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        url: site.url,
      },
      scans: scans || [],
      stats,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('GET /api/sites/[id]/security/history error:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dello storico di sicurezza' },
      { status: 500 }
    );
  }
}
