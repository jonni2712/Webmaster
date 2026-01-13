import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/logger';

// GET /api/team/invitations/accept?token=xxx - Get invitation details by token
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token mancante' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get invitation by token
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        accepted_at,
        tenant:tenant_id (
          id,
          name
        ),
        inviter:invited_by (
          name,
          email
        )
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invito non trovato' }, { status: 404 });
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invito gia\' accettato' }, { status: 400 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invito scaduto' }, { status: 400 });
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        tenant_name: (invitation.tenant as any)?.name || 'Team',
        inviter_name: (invitation.inviter as any)?.name || (invitation.inviter as any)?.email,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/team/invitations/accept:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// POST /api/team/invitations/accept - Accept invitation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token mancante' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get invitation by token
    const { data: invitation, error: invError } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invito non trovato' }, { status: 404 });
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Invito gia\' accettato' }, { status: 400 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invito scaduto' }, { status: 400 });
    }

    // Check if user is logged in
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // User needs to login or register first
      return NextResponse.json({
        error: 'Devi effettuare il login per accettare l\'invito',
        requiresAuth: true,
        invitation: {
          email: invitation.email,
          role: invitation.role,
        },
      }, { status: 401 });
    }

    // Get logged in user's email
    const { data: currentUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', session.user.id)
      .single();

    // Verify the logged in user matches the invitation email
    if (currentUser?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({
        error: `Questo invito e' per ${invitation.email}. Effettua il login con quell'account.`,
        emailMismatch: true,
        expectedEmail: invitation.email,
      }, { status: 403 });
    }

    // Check if user is already a member of the tenant
    const { data: existingMembership } = await supabase
      .from('user_tenants')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('tenant_id', invitation.tenant_id)
      .single();

    if (existingMembership) {
      // User is already a member, just mark invitation as accepted
      await supabase
        .from('team_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return NextResponse.json({
        success: true,
        message: 'Sei gia\' membro di questo team',
        alreadyMember: true,
      });
    }

    // Add user to tenant
    const { error: memberError } = await supabase
      .from('user_tenants')
      .insert({
        user_id: session.user.id,
        tenant_id: invitation.tenant_id,
        role: invitation.role,
      });

    if (memberError) {
      console.error('Error adding user to tenant:', memberError);
      return NextResponse.json(
        { error: 'Errore nell\'aggiunta al team' },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    await supabase
      .from('team_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    // Log activity
    await logActivity({
      tenantId: invitation.tenant_id,
      userId: session.user.id,
      actionType: 'member_joined',
      targetUserId: session.user.id,
      targetUserEmail: invitation.email,
      metadata: { role: invitation.role, invitation_id: invitation.id },
    });

    // Get tenant name for response
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', invitation.tenant_id)
      .single();

    return NextResponse.json({
      success: true,
      message: `Sei entrato nel team ${tenant?.name || ''}`,
      tenant: {
        id: invitation.tenant_id,
        name: tenant?.name,
      },
      role: invitation.role,
    });
  } catch (error) {
    console.error('Error in POST /api/team/invitations/accept:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
