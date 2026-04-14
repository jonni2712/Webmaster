import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.current_tenant_id) {
    return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('stripe_customer_id')
    .eq('id', user.current_tenant_id)
    .single();

  if (!tenant?.stripe_customer_id) {
    return NextResponse.json({ info: null });
  }

  try {
    const customer = await stripe.customers.retrieve(tenant.stripe_customer_id);
    if (customer.deleted) {
      return NextResponse.json({ info: null });
    }

    const meta = customer.metadata || {};
    return NextResponse.json({
      info: {
        companyName: customer.name || '',
        vatNumber: meta.vat_number || '',
        codiceFiscale: meta.codice_fiscale || '',
        codiceSdi: meta.codice_sdi || '',
        pec: meta.pec || '',
        phone: customer.phone || '',
      },
    });
  } catch {
    return NextResponse.json({ info: null });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const body = await request.json();
  const { companyName, vatNumber, codiceFiscale, codiceSdi, pec, phone } = body;

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from('users')
    .select('current_tenant_id')
    .eq('id', session.user.id)
    .single();

  if (!user?.current_tenant_id) {
    return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('stripe_customer_id')
    .eq('id', user.current_tenant_id)
    .single();

  if (!tenant?.stripe_customer_id) {
    return NextResponse.json({ error: 'Nessun cliente Stripe' }, { status: 400 });
  }

  try {
    await stripe.customers.update(tenant.stripe_customer_id, {
      name: companyName || undefined,
      phone: phone || undefined,
      metadata: {
        vat_number: vatNumber || '',
        codice_fiscale: codiceFiscale || '',
        codice_sdi: codiceSdi || '',
        pec: pec || '',
      },
    });

    // If VAT number provided, add it as a Tax ID on Stripe
    if (vatNumber && vatNumber.startsWith('IT')) {
      try {
        // List existing tax IDs to avoid duplicates
        const existingTaxIds = await stripe.customers.listTaxIds(tenant.stripe_customer_id);
        const alreadyHas = existingTaxIds.data.some(t => t.value === vatNumber);
        if (!alreadyHas) {
          await stripe.customers.createTaxId(tenant.stripe_customer_id, {
            type: 'eu_vat',
            value: vatNumber,
          });
        }
      } catch (taxErr) {
        console.error('[billing/info] Failed to set Tax ID:', taxErr);
        // Non-fatal — continue
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[billing/info] Failed to update customer:', err);
    return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 });
  }
}
