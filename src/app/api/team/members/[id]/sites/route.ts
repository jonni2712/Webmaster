import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/logger';

// GET /api/team/members/[id]/sites - Get member's site access
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

    // Verify member belongs to tenant
    const { data: member } = await supabase
      .from('user_tenants')
      .select('id, user_id, role')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Membro non trovato' }, { status: 404 });
    }

    // Get all tenant sites
    const { data: allSites } = await supabase
      .from('sites')
      .select('id, name, url')
      .eq('tenant_id', user.current_tenant_id)
      .order('name');

    // Get member's site access
    const { data: siteAccess } = await supabase
      .from('member_site_access')
      .select('site_id')
      .eq('user_tenant_id', id);

    const accessedSiteIds = new Set(siteAccess?.map(sa => sa.site_id) || []);

    // Owner and Admin have access to all sites by default
    const hasFullAccess = member.role === 'owner' || member.role === 'admin';

    const sites = allSites?.map(site => ({
      id: site.id,
      name: site.name,
      url: site.url,
      hasAccess: hasFullAccess || accessedSiteIds.has(site.id),
    })) || [];

    return NextResponse.json({
      member: {
        id: member.id,
        role: member.role,
        hasFullAccess,
      },
      sites,
    });
  } catch (error) {
    console.error('Error in GET /api/team/members/[id]/sites:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// PUT /api/team/members/[id]/sites - Update member's site access
export async function PUT(
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

    // Check if current user is admin or owner
    const { data: currentUserMembership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!currentUserMembership || !['owner', 'admin'].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per modificare gli accessi' },
        { status: 403 }
      );
    }

    // Verify target member belongs to tenant and get their info
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

    // Cannot modify site access for owner/admin (they have full access)
    if (targetMember.role === 'owner' || targetMember.role === 'admin') {
      return NextResponse.json(
        { error: 'Owner e Admin hanno accesso a tutti i siti automaticamente' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { siteIds } = body;

    if (!Array.isArray(siteIds)) {
      return NextResponse.json({ error: 'siteIds deve essere un array' }, { status: 400 });
    }

    // Verify all site IDs belong to tenant
    if (siteIds.length > 0) {
      const { data: validSites } = await supabase
        .from('sites')
        .select('id')
        .eq('tenant_id', user.current_tenant_id)
        .in('id', siteIds);

      if (!validSites || validSites.length !== siteIds.length) {
        return NextResponse.json(
          { error: 'Alcuni siti non sono validi' },
          { status: 400 }
        );
      }
    }

    // Get current site access
    const { data: currentAccess } = await supabase
      .from('member_site_access')
      .select('site_id')
      .eq('user_tenant_id', id);

    const currentSiteIds = new Set(currentAccess?.map(a => a.site_id) || []);
    const newSiteIds = new Set(siteIds);

    // Calculate grants and revokes
    const sitesToGrant = siteIds.filter((siteId: string) => !currentSiteIds.has(siteId));
    const sitesToRevoke = [...currentSiteIds].filter(siteId => !newSiteIds.has(siteId));

    // Delete revoked access
    if (sitesToRevoke.length > 0) {
      const { error: deleteError } = await supabase
        .from('member_site_access')
        .delete()
        .eq('user_tenant_id', id)
        .in('site_id', sitesToRevoke);

      if (deleteError) {
        console.error('Error revoking site access:', deleteError);
        return NextResponse.json(
          { error: 'Errore nella revoca degli accessi' },
          { status: 500 }
        );
      }
    }

    // Insert new access
    if (sitesToGrant.length > 0) {
      const accessRecords = sitesToGrant.map((siteId: string) => ({
        user_tenant_id: id,
        site_id: siteId,
      }));

      const { error: insertError } = await supabase
        .from('member_site_access')
        .insert(accessRecords);

      if (insertError) {
        console.error('Error granting site access:', insertError);
        return NextResponse.json(
          { error: 'Errore nell\'assegnazione degli accessi' },
          { status: 500 }
        );
      }
    }

    // Log activity for grants
    const targetEmail = (targetMember.users as any)?.email;

    if (sitesToGrant.length > 0) {
      // Get site names for logging
      const { data: grantedSites } = await supabase
        .from('sites')
        .select('id, name')
        .in('id', sitesToGrant);

      for (const site of grantedSites || []) {
        await logActivity({
          tenantId: user.current_tenant_id,
          userId: session.user.id,
          actionType: 'site_access_granted',
          resourceType: 'site',
          resourceId: site.id,
          resourceName: site.name,
          targetUserId: targetMember.user_id,
          targetUserEmail: targetEmail,
        });
      }
    }

    // Log activity for revokes
    if (sitesToRevoke.length > 0) {
      const { data: revokedSites } = await supabase
        .from('sites')
        .select('id, name')
        .in('id', sitesToRevoke);

      for (const site of revokedSites || []) {
        await logActivity({
          tenantId: user.current_tenant_id,
          userId: session.user.id,
          actionType: 'site_access_revoked',
          resourceType: 'site',
          resourceId: site.id,
          resourceName: site.name,
          targetUserId: targetMember.user_id,
          targetUserEmail: targetEmail,
        });
      }
    }

    return NextResponse.json({
      success: true,
      granted: sitesToGrant.length,
      revoked: sitesToRevoke.length,
    });
  } catch (error) {
    console.error('Error in PUT /api/team/members/[id]/sites:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
