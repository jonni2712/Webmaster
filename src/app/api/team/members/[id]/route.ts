import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/logger';
import type { MemberRole } from '@/types/database';

// GET /api/team/members/[id] - Get member details
export async function GET(
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

    // Get member
    const { data: member, error } = await supabase
      .from('user_tenants')
      .select(`
        id,
        user_id,
        role,
        created_at,
        users:user_id (
          id,
          email,
          name,
          avatar_url
        )
      `)
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Membro non trovato' }, { status: 404 });
    }

    // Get site access
    const { data: siteAccess } = await supabase
      .from('member_site_access')
      .select(`
        id,
        site_id,
        created_at,
        sites:site_id (
          id,
          name,
          url
        )
      `)
      .eq('user_tenant_id', id);

    const userData = member.users as any;

    return NextResponse.json({
      member: {
        id: member.id,
        user_id: member.user_id,
        email: userData?.email || '',
        name: userData?.name || null,
        avatar_url: userData?.avatar_url || null,
        role: member.role,
        created_at: member.created_at,
        site_access: siteAccess?.map(sa => ({
          id: sa.id,
          site_id: sa.site_id,
          site_name: (sa.sites as any)?.name,
          site_url: (sa.sites as any)?.url,
        })) || [],
      },
    });
  } catch (error) {
    console.error('Error in GET /api/team/members/[id]:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// PATCH /api/team/members/[id] - Update member role
export async function PATCH(
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

    // Get user's tenant and role
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    // Get current user's role
    const { data: currentUserMembership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!currentUserMembership || !['owner', 'admin'].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per modificare i membri' },
        { status: 403 }
      );
    }

    // Get target member
    const { data: targetMember } = await supabase
      .from('user_tenants')
      .select(`
        id,
        user_id,
        role,
        users:user_id (email)
      `)
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Membro non trovato' }, { status: 404 });
    }

    const body = await request.json();
    const { role: newRole } = body;

    // Validate new role
    const validRoles: MemberRole[] = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 });
    }

    // Cannot change owner's role
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Non e\' possibile modificare il ruolo del proprietario' },
        { status: 403 }
      );
    }

    // Admin cannot promote to admin
    if (currentUserMembership.role === 'admin' && newRole === 'admin') {
      return NextResponse.json(
        { error: 'Solo il proprietario puo\' promuovere ad amministratore' },
        { status: 403 }
      );
    }

    // Cannot demote self
    if (targetMember.user_id === session.user.id) {
      return NextResponse.json(
        { error: 'Non puoi modificare il tuo ruolo' },
        { status: 403 }
      );
    }

    const oldRole = targetMember.role;

    // Update role
    const { error: updateError } = await supabase
      .from('user_tenants')
      .update({ role: newRole })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating member role:', updateError);
      return NextResponse.json(
        { error: 'Errore nell\'aggiornamento del ruolo' },
        { status: 500 }
      );
    }

    // Log activity
    await logActivity({
      tenantId: user.current_tenant_id,
      userId: session.user.id,
      actionType: 'role_changed',
      targetUserId: targetMember.user_id,
      targetUserEmail: (targetMember.users as any)?.email,
      metadata: { old_role: oldRole, new_role: newRole },
    });

    return NextResponse.json({ success: true, role: newRole });
  } catch (error) {
    console.error('Error in PATCH /api/team/members/[id]:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// DELETE /api/team/members/[id] - Remove member from team
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

    // Get user's tenant and role
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    // Get current user's role
    const { data: currentUserMembership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!currentUserMembership || !['owner', 'admin'].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per rimuovere membri' },
        { status: 403 }
      );
    }

    // Get target member
    const { data: targetMember } = await supabase
      .from('user_tenants')
      .select(`
        id,
        user_id,
        role,
        users:user_id (email)
      `)
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Membro non trovato' }, { status: 404 });
    }

    // Cannot remove owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Non e\' possibile rimuovere il proprietario' },
        { status: 403 }
      );
    }

    // Admin cannot remove other admins
    if (currentUserMembership.role === 'admin' && targetMember.role === 'admin') {
      return NextResponse.json(
        { error: 'Solo il proprietario puo\' rimuovere amministratori' },
        { status: 403 }
      );
    }

    // Cannot remove self
    if (targetMember.user_id === session.user.id) {
      return NextResponse.json(
        { error: 'Non puoi rimuovere te stesso dal team' },
        { status: 403 }
      );
    }

    const targetEmail = (targetMember.users as any)?.email;

    // Delete member (cascade will remove site access)
    const { error: deleteError } = await supabase
      .from('user_tenants')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json(
        { error: 'Errore nella rimozione del membro' },
        { status: 500 }
      );
    }

    // Log activity
    await logActivity({
      tenantId: user.current_tenant_id,
      userId: session.user.id,
      actionType: 'member_removed',
      targetUserId: targetMember.user_id,
      targetUserEmail: targetEmail,
      metadata: { removed_role: targetMember.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/team/members/[id]:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
