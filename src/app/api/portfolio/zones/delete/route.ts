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
    const { primaryDomainId } = body;

    if (!primaryDomainId) {
      return NextResponse.json({ error: 'primaryDomainId richiesto' }, { status: 400 });
    }

    // Remove all domains from this zone
    const { error: removeError } = await supabase
      .from('sites')
      .update({ primary_domain_id: null })
      .eq('primary_domain_id', primaryDomainId)
      .eq('tenant_id', user.current_tenant_id);

    if (removeError) {
      return NextResponse.json({ error: removeError.message }, { status: 500 });
    }

    // Clear zone_name from primary domain
    const { error: clearError } = await supabase
      .from('sites')
      .update({ zone_name: null })
      .eq('id', primaryDomainId)
      .eq('tenant_id', user.current_tenant_id);

    if (clearError) {
      return NextResponse.json({ error: clearError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('POST /api/portfolio/zones/delete error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
