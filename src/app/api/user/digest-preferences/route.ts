import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import type { DigestPreferences } from '@/types/database';

const digestPreferencesSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(['daily', 'weekly', 'none']),
  day_of_week: z.number().min(0).max(6),
  hour: z.number().min(0).max(23),
  email: z.string().email().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    // Get tenant settings
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.current_tenant_id)
      .single();

    const preferences = (tenant?.settings?.digest_preferences || null) as DigestPreferences | null;

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('GET /api/user/digest-preferences error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = digestPreferencesSchema.safeParse(body.preferences);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.flatten() },
        { status: 400 }
      );
    }

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
        { error: 'Non hai i permessi per modificare queste impostazioni' },
        { status: 403 }
      );
    }

    // Get current tenant settings
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.current_tenant_id)
      .single();

    const currentSettings = tenant?.settings || {};

    // Update tenant settings with new digest preferences
    const { error } = await supabase
      .from('tenants')
      .update({
        settings: {
          ...currentSettings,
          digest_preferences: validation.data,
        },
      })
      .eq('id', user.current_tenant_id);

    if (error) {
      console.error('Error updating digest preferences:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, preferences: validation.data });
  } catch (error) {
    console.error('PUT /api/user/digest-preferences error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
