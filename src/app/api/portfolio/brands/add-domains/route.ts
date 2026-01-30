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
    const { brandId, domainIds } = body;

    if (!brandId || !domainIds || !Array.isArray(domainIds) || domainIds.length === 0) {
      return NextResponse.json({ error: 'brandId e domainIds richiesti' }, { status: 400 });
    }

    // Update domains to set their brand_id
    const { error } = await supabase
      .from('sites')
      .update({ brand_id: brandId })
      .in('id', domainIds)
      .eq('tenant_id', user.current_tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If brand doesn't have a primary domain yet, set the first one
    const { data: brand } = await supabase
      .from('brands')
      .select('primary_domain_id')
      .eq('id', brandId)
      .single();

    if (!brand?.primary_domain_id && domainIds.length > 0) {
      // Set first domain as primary
      await supabase
        .from('sites')
        .update({ is_primary_for_brand: true })
        .eq('id', domainIds[0])
        .eq('tenant_id', user.current_tenant_id);

      await supabase
        .from('brands')
        .update({ primary_domain_id: domainIds[0] })
        .eq('id', brandId);
    }

    return NextResponse.json({
      success: true,
      added: domainIds.length,
    });

  } catch (error) {
    console.error('POST /api/portfolio/brands/add-domains error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
