import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/logger';

// GET /api/clients/[id] - Get single client with sites
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get client
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });
    }

    // Get client's sites
    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .eq('client_id', id)
      .eq('tenant_id', user.current_tenant_id)
      .order('name');

    // Calculate stats
    const sitesCount = sites?.length || 0;
    const sitesUp = sites?.filter(s => s.status === 'online').length || 0;
    const sitesDown = sites?.filter(s => s.status === 'offline').length || 0;

    return NextResponse.json({
      ...client,
      sites_count: sitesCount,
      sites_up: sitesUp,
      sites_down: sitesDown,
      sites: sites || [],
    });
  } catch (error) {
    console.error('Error in GET /api/clients/[id]:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check client exists and belongs to tenant
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });
    }

    const body = await request.json();

    // Update client
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        name: body.name,
        company_name: body.company_name || null,
        email: body.email || null,
        phone: body.phone || null,
        referent_name: body.referent_name || null,
        referent_email: body.referent_email || null,
        referent_phone: body.referent_phone || null,
        address: body.address || null,
        vat_number: body.vat_number || null,
        fiscal_code: body.fiscal_code || null,
        logo_url: body.logo_url || null,
        notes: body.notes || null,
        is_active: body.is_active ?? true,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json({ error: 'Errore nell\'aggiornamento del cliente' }, { status: 500 });
    }

    // Log activity
    await logActivity({
      tenantId: user.current_tenant_id,
      userId: session.user.id,
      actionType: 'client_updated',
      resourceType: 'client',
      resourceId: client.id,
      resourceName: client.name,
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error in PUT /api/clients/[id]:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check client exists and belongs to tenant
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!existingClient) {
      return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });
    }

    const clientName = existingClient.name;

    // Remove client_id from sites (don't delete sites, just unlink)
    await supabase
      .from('sites')
      .update({ client_id: null })
      .eq('client_id', id);

    // Delete client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json({ error: 'Errore nell\'eliminazione del cliente' }, { status: 500 });
    }

    // Log activity
    await logActivity({
      tenantId: user.current_tenant_id,
      userId: session.user.id,
      actionType: 'client_deleted',
      resourceType: 'client',
      resourceId: id,
      resourceName: clientName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/clients/[id]:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
