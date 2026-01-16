import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

interface VercelWebhookPayload {
  id: string;
  type: 'deployment.created' | 'deployment.succeeded' | 'deployment.ready' | 'deployment.error' | 'deployment.canceled';
  createdAt: number;
  payload: {
    deployment: {
      id: string;
      url: string;
      name: string;
      meta?: {
        githubCommitRef?: string;
        githubCommitSha?: string;
        githubCommitMessage?: string;
        githubCommitAuthorName?: string;
      };
    };
    project: {
      id: string;
      name: string;
    };
    target?: 'production' | 'preview';
    user?: {
      id: string;
      username: string;
    };
    team?: {
      id: string;
      name: string;
    };
  };
}

/**
 * Verify Vercel webhook signature
 */
function verifySignature(body: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /api/webhooks/vercel
 * Handle Vercel deployment webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-vercel-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    let payload: VercelWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find site by Vercel project ID
    const { data: site } = await supabase
      .from('sites')
      .select('id, tenant_id, vercel_webhook_secret, name')
      .eq('vercel_project_id', payload.payload.project.id)
      .single();

    if (!site) {
      // Project not connected to any site
      return NextResponse.json({ received: true, matched: false });
    }

    // Verify signature
    if (site.vercel_webhook_secret) {
      const isValid = verifySignature(body, signature, site.vercel_webhook_secret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const deployment = payload.payload.deployment;
    const meta = deployment.meta || {};

    // Map webhook type to deployment state
    const stateMap: Record<string, string> = {
      'deployment.created': 'BUILDING',
      'deployment.succeeded': 'READY',
      'deployment.ready': 'READY',
      'deployment.error': 'ERROR',
      'deployment.canceled': 'CANCELED',
    };

    const state = stateMap[payload.type] || 'BUILDING';

    // Upsert deployment
    const { error: deploymentError } = await supabase.from('vercel_deployments').upsert(
      {
        site_id: site.id,
        tenant_id: site.tenant_id,
        deployment_id: deployment.id,
        deployment_url: deployment.url ? `https://${deployment.url}` : null,
        state,
        target: payload.payload.target || null,
        git_branch: meta.githubCommitRef || null,
        git_commit_sha: meta.githubCommitSha || null,
        git_commit_message: meta.githubCommitMessage || null,
        git_commit_author: meta.githubCommitAuthorName || null,
        created_at: new Date(payload.createdAt).toISOString(),
        ready_at: state === 'READY' ? new Date().toISOString() : null,
        error_message: state === 'ERROR' ? 'Deployment failed' : null,
        meta,
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'site_id,deployment_id' }
    );

    if (deploymentError) {
      console.error('Error saving deployment:', deploymentError);
    }

    // Create alert for failed deployments
    if (state === 'ERROR') {
      await supabase.from('alerts').insert({
        tenant_id: site.tenant_id,
        site_id: site.id,
        trigger_type: 'site_down', // Using existing type, could add 'deployment_failed' later
        severity: 'critical',
        title: `Deploy fallito: ${site.name}`,
        message: `Il deployment ${deployment.id.substring(0, 8)} su ${payload.payload.target || 'preview'} e\' fallito.`,
        details: {
          deployment_id: deployment.id,
          deployment_url: deployment.url,
          target: payload.payload.target,
          git_commit: meta.githubCommitSha,
        },
        status: 'triggered',
        channels_notified: [],
      });
    }

    // Update site last sync
    await supabase
      .from('sites')
      .update({ vercel_last_sync: new Date().toISOString() })
      .eq('id', site.id);

    return NextResponse.json({
      received: true,
      matched: true,
      site_id: site.id,
      deployment_state: state,
    });
  } catch (error) {
    console.error('Vercel webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
