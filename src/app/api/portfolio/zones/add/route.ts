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
    const { primaryDomainId, domainIds } = body;

    if (!primaryDomainId || !domainIds || !Array.isArray(domainIds)) {
      return NextResponse.json({ error: 'primaryDomainId e domainIds richiesti' }, { status: 400 });
    }

    // Update domains to set their primary_domain_id
    const { error } = await supabase
      .from('sites')
      .update({ primary_domain_id: primaryDomainId })
      .in('id', domainIds)
      .eq('tenant_id', user.current_tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: domainIds.length,
    });

  } catch (error) {
    console.error('POST /api/portfolio/zones/add error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
