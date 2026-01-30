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
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json({ error: 'domainId richiesto' }, { status: 400 });
    }

    // Get domain info before removing
    const { data: domain } = await supabase
      .from('sites')
      .select('brand_id, is_primary_for_brand')
      .eq('id', domainId)
      .single();

    // Remove domain from brand
    const { error } = await supabase
      .from('sites')
      .update({ brand_id: null, is_primary_for_brand: false })
      .eq('id', domainId)
      .eq('tenant_id', user.current_tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If this was the primary domain, update the brand and set a new primary
    if (domain?.is_primary_for_brand && domain.brand_id) {
      // Find another domain in this brand to be primary
      const { data: otherDomains } = await supabase
        .from('sites')
        .select('id')
        .eq('brand_id', domain.brand_id)
        .neq('id', domainId)
        .limit(1);

      if (otherDomains && otherDomains.length > 0) {
        await supabase
          .from('sites')
          .update({ is_primary_for_brand: true })
          .eq('id', otherDomains[0].id);

        await supabase
          .from('brands')
          .update({ primary_domain_id: otherDomains[0].id })
          .eq('id', domain.brand_id);
      } else {
        // No more domains in brand
        await supabase
          .from('brands')
          .update({ primary_domain_id: null })
          .eq('id', domain.brand_id);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('POST /api/portfolio/brands/remove-domain error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
