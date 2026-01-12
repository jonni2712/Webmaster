import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/clients - List all clients
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

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', user.current_tenant_id)
      .order('name');

    if (search) {
      query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: clients, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json({ error: 'Errore nel recupero clienti' }, { status: 500 });
    }

    // Get site counts for each client
    const clientIds = clients?.map(c => c.id) || [];

    let clientsWithStats = clients || [];

    if (clientIds.length > 0) {
      const { data: siteCounts } = await supabase
        .from('sites')
        .select('client_id, status')
        .eq('tenant_id', user.current_tenant_id)
        .in('client_id', clientIds);

      const statsMap = new Map<string, { total: number; up: number; down: number }>();

      siteCounts?.forEach(site => {
        if (!site.client_id) return;
        const stats = statsMap.get(site.client_id) || { total: 0, up: 0, down: 0 };
        stats.total++;
        if (site.status === 'online') stats.up++;
        if (site.status === 'offline') stats.down++;
        statsMap.set(site.client_id, stats);
      });

      clientsWithStats = clients?.map(client => ({
        ...client,
        sites_count: statsMap.get(client.id)?.total || 0,
        sites_up: statsMap.get(client.id)?.up || 0,
        sites_down: statsMap.get(client.id)?.down || 0,
      })) || [];
    }

    return NextResponse.json({ clients: clientsWithStats });
  } catch (error) {
    console.error('Error in GET /api/clients:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: 'Nome cliente richiesto' }, { status: 400 });
    }

    // Create client
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        tenant_id: user.current_tenant_id,
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
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json({ error: 'Errore nella creazione del cliente' }, { status: 500 });
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/clients:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
