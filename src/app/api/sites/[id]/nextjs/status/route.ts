import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/lib/crypto';
import crypto from 'crypto';

/**
 * Constant-time API key comparison to prevent timing attacks.
 * Returns false on any error (decryption failure, length mismatch).
 */
function verifyApiKey(stored: string | null, provided: string): boolean {
  if (!stored) return false;
  const decrypted = (() => {
    try {
      return decrypt(stored);
    } catch {
      return null;
    }
  })();
  if (!decrypted) return false;
  const a = Buffer.from(decrypted);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * POST /api/sites/[id]/nextjs/status
 * Receive status data from Next.js sites with monitor script installed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verify API key
    const apiKey = request.headers.get('x-wm-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Find site by ID and verify API key
    const { data: site } = await supabase
      .from('sites')
      .select('id, tenant_id, api_key_encrypted, platform')
      .eq('id', id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (site.platform !== 'nextjs') {
      return NextResponse.json({ error: 'Not a Next.js site' }, { status: 400 });
    }

    // Verify API key matches (constant-time comparison after decryption)
    if (!verifyApiKey(site.api_key_encrypted, apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();

    // Validate payload
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Build update object for the site
    const updateData: Record<string, unknown> = {
      last_sync: new Date().toISOString(),
      status: 'online',
    };

    // Store Next.js specific info in a JSONB field
    const nextjsInfo: Record<string, unknown> = {};

    // Framework info
    if (body.framework) {
      nextjsInfo.framework = body.framework;
    }

    // Node.js version
    if (body.node) {
      nextjsInfo.node = body.node;
    }

    // Dependencies
    if (body.dependencies) {
      nextjsInfo.dependencies = body.dependencies;
    }

    // Build info
    if (body.build) {
      nextjsInfo.build = body.build;
    }

    // Environment
    if (body.environment) {
      nextjsInfo.environment = body.environment;
    }

    // Server info
    if (body.server) {
      updateData.server_info = body.server;
    }

    // Performance metrics
    if (body.performance) {
      nextjsInfo.performance = body.performance;
    }

    // Health checks
    if (body.health) {
      nextjsInfo.health = body.health;
    }

    // Custom data
    if (body.custom) {
      nextjsInfo.custom = body.custom;
    }

    // Store all Next.js info
    updateData.wp_info = nextjsInfo; // Reusing wp_info field for Next.js data

    // Update site
    const { error: updateError } = await supabase
      .from('sites')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating site:', updateError);
      return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      received_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('POST /api/sites/[id]/nextjs/status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sites/[id]/nextjs/status
 * Get current status configuration for the site
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const apiKey = request.headers.get('x-wm-api-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: site } = await supabase
    .from('sites')
    .select('id, api_key_encrypted, platform, name')
    .eq('id', id)
    .single();

  if (!site || !verifyApiKey(site.api_key_encrypted, apiKey)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  return NextResponse.json({
    site_id: site.id,
    site_name: site.name,
    platform: site.platform,
    connected: true,
  });
}
