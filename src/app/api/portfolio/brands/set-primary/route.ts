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

    // Clear is_primary_for_brand for all domains in this brand
    // Also reset domain_relation from 'primary' to 'standalone' for the old primary
    await supabase
      .from('sites')
      .update({
        is_primary_for_brand: false,
        domain_relation: 'standalone',
      })
      .eq('brand_id', brandId)
      .eq('is_primary_for_brand', true)
      .eq('tenant_id', user.current_tenant_id);

    // Set the new primary
    const { error: updateError } = await supabase
      .from('sites')
      .update({
        is_primary_for_brand: true,
        domain_relation: 'primary',
      })
      .eq('id', domainId)
      .eq('brand_id', brandId)
      .eq('tenant_id', user.current_tenant_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update brand's primary_domain_id
    await supabase
      .from('brands')
      .update({ primary_domain_id: domainId })
      .eq('id', brandId)
      .eq('tenant_id', user.current_tenant_id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('POST /api/portfolio/brands/set-primary error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
