import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  try {
    const body = await request.json();
    const {
      domainId,
      domain_relation,
      weglot_language_code,
      redirect_url,
      redirect_type,
      parent_site_id,
    } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'domainId richiesto' }, { status: 400 });
    }

    // Build the update object
    const updateData: Record<string, unknown> = {
      domain_relation: domain_relation || 'standalone',
    };

    // Handle Weglot language
    if (domain_relation === 'weglot_language') {
      updateData.weglot_language_code = weglot_language_code || null;
      updateData.parent_site_id = parent_site_id || null;
      updateData.is_redirect_source = false;
      updateData.redirect_url = null;
      updateData.redirect_type = null;
    }
    // Handle Redirect
    else if (domain_relation === 'redirect') {
      updateData.redirect_url = redirect_url || null;
      updateData.redirect_type = redirect_type || '301';
      updateData.is_redirect_source = !!redirect_url;
      updateData.weglot_language_code = null;
      updateData.parent_site_id = null;
    }
    // Handle WordPress subsite
    else if (domain_relation === 'wordpress_subsite') {
      updateData.parent_site_id = parent_site_id || null;
      updateData.weglot_language_code = null;
      updateData.is_redirect_source = false;
      updateData.redirect_url = null;
      updateData.redirect_type = null;
    }
    // Handle other types (alias, standalone)
    else {
      updateData.weglot_language_code = null;
      updateData.parent_site_id = null;
      updateData.is_redirect_source = false;
      updateData.redirect_url = null;
      updateData.redirect_type = null;
    }

    const { error } = await supabase
      .from('sites')
      .update(updateData)
      .eq('id', domainId)
      .eq('tenant_id', user.current_tenant_id);

    if (error) {
      console.error('Update domain relation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('POST /api/portfolio/brands/update-domain-relation error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
