import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

// DELETE /api/team/invitations/[id] - Cancel/revoke invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Get user's tenant
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    // Check if user is admin or owner
    const { data: membership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per annullare inviti' },
        { status: 403 }
      );
    }

    // Check invitation exists and belongs to tenant
    const { data: invitation } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .is('accepted_at', null)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Invito non trovato' }, { status: 404 });
    }

    // Delete invitation
    const { error } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting invitation:', error);
      return NextResponse.json({ error: 'Errore nell\'annullamento invito' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/team/invitations/[id]:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
