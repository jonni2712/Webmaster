import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import type { TeamInvitation } from '@/types/database';

// GET /api/team/invitations - List pending invitations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

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

    // Get pending invitations
    const { data: invitations, error } = await supabase
      .from('team_invitations')
      .select(`
        id,
        tenant_id,
        email,
        role,
        invited_by,
        token,
        expires_at,
        accepted_at,
        created_at,
        inviter:invited_by (
          name,
          email
        )
      `)
      .eq('tenant_id', user.current_tenant_id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json({ error: 'Errore nel recupero inviti' }, { status: 500 });
    }

    // Transform to TeamInvitation format
    const formattedInvitations: TeamInvitation[] = invitations?.map(inv => ({
      id: inv.id,
      tenant_id: inv.tenant_id,
      email: inv.email,
      role: inv.role as any,
      invited_by: inv.invited_by,
      inviter_name: (inv.inviter as any)?.name || null,
      inviter_email: (inv.inviter as any)?.email || '',
      token: inv.token,
      expires_at: inv.expires_at,
      accepted_at: inv.accepted_at,
      created_at: inv.created_at,
    })) || [];

    return NextResponse.json({ invitations: formattedInvitations });
  } catch (error) {
    console.error('Error in GET /api/team/invitations:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
