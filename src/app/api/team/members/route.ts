import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/logger';
import { sendEmail } from '@/lib/email/client';
import { TeamInviteTemplate } from '@/lib/email/templates/team-invite';
import crypto from 'crypto';
import type { TeamMember, MemberRole } from '@/types/database';

// GET /api/team/members - List all team members
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

    // Get current user's role in tenant
    const { data: currentMembership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    const currentUserRole = (currentMembership?.role as MemberRole) || 'viewer';

    // Get all members of the tenant
    const { data: memberships, error } = await supabase
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
      .eq('tenant_id', user.current_tenant_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json({ error: 'Errore nel recupero membri' }, { status: 500 });
    }

    // Get site access counts for each member
    const memberIds = memberships?.map(m => m.id) || [];
    let siteAccessCounts = new Map<string, number>();

    if (memberIds.length > 0) {
      const { data: accessData } = await supabase
        .from('member_site_access')
        .select('user_tenant_id')
        .in('user_tenant_id', memberIds);

      accessData?.forEach(access => {
        const count = siteAccessCounts.get(access.user_tenant_id) || 0;
        siteAccessCounts.set(access.user_tenant_id, count + 1);
      });
    }

    // Transform to TeamMember format
    const members: TeamMember[] = memberships?.map(m => {
      const userData = m.users as any;
      const accessCount = siteAccessCounts.get(m.id) || 0;
      const role = m.role as MemberRole;

      // Owner and admin always have full access
      const hasFullAccess = role === 'owner' || role === 'admin';

      return {
        id: m.id,
        user_id: m.user_id,
        email: userData?.email || '',
        name: userData?.name || null,
        avatar_url: userData?.avatar_url || null,
        role: role,
        site_access: hasFullAccess ? 'all' : (accessCount > 0 ? 'restricted' : 'restricted'),
        assigned_sites_count: hasFullAccess ? -1 : accessCount, // -1 means "all"
        created_at: m.created_at,
      };
    }) || [];

    return NextResponse.json({ members, currentUserRole });
  } catch (error) {
    console.error('Error in GET /api/team/members:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// POST /api/team/members - Invite a new team member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get user's tenant and role
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id, name, email')
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
        { error: 'Non hai i permessi per invitare membri' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    // Validate input
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email e ruolo sono richiesti' },
        { status: 400 }
      );
    }

    // Validate role (can't invite as owner, and admin can only invite member/viewer)
    const validRoles: MemberRole[] = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Ruolo non valido' },
        { status: 400 }
      );
    }

    // Admin cannot invite other admins
    if (membership.role === 'admin' && role === 'admin') {
      return NextResponse.json(
        { error: 'Solo il proprietario puo\' invitare amministratori' },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from('user_tenants')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('tenant_id', user.current_tenant_id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'Questo utente e\' gia\' membro del team' },
          { status: 400 }
        );
      }
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('tenant_id', user.current_tenant_id)
      .eq('email', email)
      .is('accepted_at', null)
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Esiste gia\' un invito pendente per questa email' },
        { status: 400 }
      );
    }

    // Get tenant name for email
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', user.current_tenant_id)
      .single();

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert({
        tenant_id: user.current_tenant_id,
        email,
        role,
        invited_by: session.user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Errore nella creazione dell\'invito' },
        { status: 500 }
      );
    }

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL}/accept-invite/${token}`;

    try {
      await sendEmail({
        to: email,
        subject: `Sei stato invitato a unirti a ${tenant?.name || 'un team'} su Webmaster Monitor`,
        react: TeamInviteTemplate({
          inviterName: user.name || user.email || 'Un membro del team',
          teamName: tenant?.name || 'Team',
          role: role,
          inviteUrl,
        }),
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail the request, invitation is created
    }

    // Log activity
    await logActivity({
      tenantId: user.current_tenant_id,
      userId: session.user.id,
      actionType: 'member_invited',
      targetUserEmail: email,
      metadata: { role, invitation_id: invitation.id },
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email,
        role,
        expires_at: invitation.expires_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/team/members:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
