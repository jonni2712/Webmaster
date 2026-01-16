import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { userCanAccessSite } from '@/lib/supabase/helpers';
import { logActivity } from '@/lib/activity/logger';
import { z } from 'zod';

const alertSettingsSchema = z.object({
  alerts_enabled: z.boolean(),
  ssl_warning_days: z.number().min(1).max(90),
  ssl_critical_days: z.number().min(1).max(30),
  uptime_cooldown_minutes: z.number().min(5).max(1440),
  ssl_cooldown_minutes: z.number().min(60).max(10080),
  notify_on_recovery: z.boolean(),
}).partial();

const updateSiteSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  platform: z.enum(['wordpress', 'prestashop', 'nextjs', 'other']).optional(),
  client_id: z.string().uuid().optional().nullable(),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  ssl_check_enabled: z.boolean().optional(),
  uptime_check_enabled: z.boolean().optional(),
  performance_check_enabled: z.boolean().optional(),
  updates_check_enabled: z.boolean().optional(),
  ecommerce_check_enabled: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  alert_settings: alertSettingsSchema.optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
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

  // Check if user can access this site
  const hasAccess = await userCanAccessSite(session.user.id, user.current_tenant_id, id);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Non hai accesso a questo sito' }, { status: 403 });
  }

  const { data: site, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (error || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  // Map database fields to expected frontend fields
  const mappedSite = {
    ...site,
    status: site.status || 'unknown',
    ssl_status: site.ssl_status || null,
    ssl_expiry: site.ssl_expires_at || null,
    uptime_percentage: site.uptime_percentage || null,
    response_time_avg: site.response_time_avg || null,
    last_check: site.last_check || site.last_sync || null,
  };

  return NextResponse.json(mappedSite);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validation = updateSiteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get user's current tenant and verify permission
    const { data: user } = await supabase
      .from('users')
      .select('current_tenant_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.current_tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check user role
    const { data: membership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per modificare questo sito' },
        { status: 403 }
      );
    }

    // Verify site belongs to tenant
    const { data: existingSite } = await supabase
      .from('sites')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!existingSite) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const { api_key, api_secret, client_id, alert_settings, ...updateData } = validation.data;

    const updatePayload: Record<string, unknown> = { ...updateData };
    // Solo aggiorna api_key se viene fornito un valore non vuoto
    // Stringa vuota = mantieni il valore esistente
    if (api_key !== undefined && api_key !== '') {
      updatePayload.api_key_encrypted = api_key;
    }
    if (api_secret !== undefined && api_secret !== '') {
      updatePayload.api_secret_encrypted = api_secret;
    }
    if (client_id !== undefined) {
      updatePayload.client_id = client_id || null;
    }
    if (alert_settings !== undefined) {
      // Merge with existing settings if partial update
      const { data: currentSite } = await supabase
        .from('sites')
        .select('alert_settings')
        .eq('id', id)
        .single();

      const currentSettings = currentSite?.alert_settings || {};
      updatePayload.alert_settings = { ...currentSettings, ...alert_settings };
    }

    const { data, error } = await supabase
      .from('sites')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await logActivity({
      tenantId: user.current_tenant_id,
      userId: session.user.id,
      actionType: 'site_updated',
      resourceType: 'site',
      resourceId: data.id,
      resourceName: data.name,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT /api/sites/[id] error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
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

  // Check user role - only owner can delete
  const { data: membership } = await supabase
    .from('user_tenants')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json(
      { error: 'Solo il proprietario puo\' eliminare i siti' },
      { status: 403 }
    );
  }

  // Verify site belongs to tenant and get name for logging
  const { data: existingSite } = await supabase
    .from('sites')
    .select('id, name')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (!existingSite) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  const siteName = existingSite.name;

  const { error } = await supabase.from('sites').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await logActivity({
    tenantId: user.current_tenant_id,
    userId: session.user.id,
    actionType: 'site_deleted',
    resourceType: 'site',
    resourceId: id,
    resourceName: siteName,
  });

  return NextResponse.json({ success: true });
}
