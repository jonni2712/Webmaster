import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity/logger';
import { z } from 'zod';
import type { DomainLifecycleStatus } from '@/types/database';

const bulkUpdateSchema = z.object({
  site_ids: z.array(z.string().uuid()).min(1, 'Seleziona almeno un sito'),
  updates: z.object({
    server_id: z.string().uuid().nullable().optional(),
    lifecycle_status: z.enum([
      'active', 'to_update', 'to_rebuild', 'in_maintenance',
      'in_progress', 'to_delete', 'redirect_only', 'archived'
    ] as const).optional(),
    is_active: z.boolean().optional(),
    client_id: z.string().uuid().nullable().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = bulkUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { site_ids, updates } = validation.data;

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

    // Check user role
    const { data: membership } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Non hai i permessi per modificare i siti' },
        { status: 403 }
      );
    }

    // Verify all sites belong to tenant
    const { data: existingSites, error: checkError } = await supabase
      .from('sites')
      .select('id, name')
      .in('id', site_ids)
      .eq('tenant_id', user.current_tenant_id);

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    const existingIds = new Set((existingSites || []).map(s => s.id));
    const invalidIds = site_ids.filter(id => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Siti non trovati: ${invalidIds.length}` },
        { status: 404 }
      );
    }

    // If server_id is provided, verify it belongs to tenant
    if (updates.server_id) {
      const { data: server } = await supabase
        .from('servers')
        .select('id')
        .eq('id', updates.server_id)
        .eq('tenant_id', user.current_tenant_id)
        .single();

      if (!server) {
        return NextResponse.json(
          { error: 'Server non trovato' },
          { status: 404 }
        );
      }
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {};

    if (updates.server_id !== undefined) {
      updatePayload.server_id = updates.server_id;
    }
    if (updates.lifecycle_status !== undefined) {
      updatePayload.lifecycle_status = updates.lifecycle_status;
    }
    if (updates.is_active !== undefined) {
      updatePayload.is_active = updates.is_active;
    }
    if (updates.client_id !== undefined) {
      updatePayload.client_id = updates.client_id;
    }
    if (updates.tags !== undefined) {
      updatePayload.tags = updates.tags;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'Nessun aggiornamento specificato' },
        { status: 400 }
      );
    }

    // Perform bulk update
    const { data, error } = await supabase
      .from('sites')
      .update(updatePayload)
      .in('id', site_ids)
      .eq('tenant_id', user.current_tenant_id)
      .select('id, name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity for each updated site
    const updateDescription = Object.keys(updatePayload).join(', ');
    for (const site of (data || [])) {
      await logActivity({
        tenantId: user.current_tenant_id,
        userId: session.user.id,
        actionType: 'site_updated',
        resourceType: 'site',
        resourceId: site.id,
        resourceName: site.name,
        metadata: { bulk_update: true, fields: updateDescription },
      });
    }

    return NextResponse.json({
      success: true,
      updated: (data || []).length,
      message: `${(data || []).length} siti aggiornati`,
    });
  } catch (error) {
    console.error('POST /api/sites/bulk error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
