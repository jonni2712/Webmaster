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
    const { brandId, domainId } = body;

    if (!brandId || !domainId) {
      return NextResponse.json({ error: 'brandId e domainId richiesti' }, { status: 400 });
    }

    // Check current status of the domain
    const { data: currentDomain } = await supabase
      .from('sites')
      .select('is_primary_for_brand')
      .eq('id', domainId)
      .eq('brand_id', brandId)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!currentDomain) {
      return NextResponse.json({ error: 'Dominio non trovato' }, { status: 404 });
    }

    // Toggle: if already primary, remove; otherwise add as primary
    const newPrimaryStatus = !currentDomain.is_primary_for_brand;

    const { error: updateError } = await supabase
      .from('sites')
      .update({
        is_primary_for_brand: newPrimaryStatus,
        domain_relation: newPrimaryStatus ? 'primary' : 'standalone',
      })
      .eq('id', domainId)
      .eq('brand_id', brandId)
      .eq('tenant_id', user.current_tenant_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, isPrimary: newPrimaryStatus });

  } catch (error) {
    console.error('POST /api/portfolio/brands/set-primary error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
