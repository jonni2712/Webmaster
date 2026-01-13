import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: siteId, updateId } = await params;

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

    // Check user role - only owner/admin can apply updates
    const { data: membership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per applicare aggiornamenti' },
        { status: 403 }
      );
    }

    // Get site with API key
    const { data: site } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
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

    // Get update details
    const { data: update } = await supabase
      .from('wp_updates')
      .select('*')
      .eq('id', updateId)
      .eq('site_id', siteId)
      .single();

    if (!update) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 });
    }

    if (update.status !== 'available') {
      return NextResponse.json(
        { error: 'Aggiornamento non disponibile o gia\' applicato' },
        { status: 400 }
      );
    }

    // Mark as in_progress
    await supabase
      .from('wp_updates')
      .update({ status: 'in_progress' })
      .eq('id', updateId);

    // Call WordPress plugin to apply update
    const siteUrl = site.url.replace(/\/$/, '');
    const apiUrl = `${siteUrl}/wp-json/webmaster-monitor/v1/apply-update`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'X-WM-API-Key': site.api_key_encrypted,
        'Content-Type': 'application/json',
        'User-Agent': 'Webmaster-Monitor/1.0',
      },
      body: JSON.stringify({
        type: update.update_type,
        slug: update.slug,
      }),
      signal: AbortSignal.timeout(120000), // 2 minutes timeout for updates
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      // Mark as failed
      await supabase
        .from('wp_updates')
        .update({
          status: 'failed',
          error_message: result.error || 'Errore sconosciuto',
        })
        .eq('id', updateId);

      return NextResponse.json({
        success: false,
        error: result.error || 'Errore durante l\'aggiornamento',
      }, { status: 500 });
    }

    // Mark as applied
    await supabase
      .from('wp_updates')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString(),
        applied_version: result.new_version,
      })
      .eq('id', updateId);

    return NextResponse.json({
      success: true,
      message: result.message || 'Aggiornamento applicato con successo',
      new_version: result.new_version,
    });

  } catch (error) {
    console.error('POST /api/sites/[id]/updates/[updateId]/apply error:', error);

    // Try to reset status on error
    try {
      const supabase = createAdminClient();
      await supabase
        .from('wp_updates')
        .update({ status: 'available' })
        .eq('id', updateId);
    } catch {}

    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Timeout: l\'aggiornamento sta impiegando troppo tempo' },
          { status: 504 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Errore durante l\'applicazione dell\'aggiornamento' },
      { status: 500 }
    );
  }
}
