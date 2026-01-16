import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { userCanAccessSite } from '@/lib/supabase/helpers';
import { VercelClient } from '@/lib/vercel/client';

/**
 * GET /api/sites/[id]/vercel/deployments
 * Get deployments for a site from database
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const target = searchParams.get('target'); // 'production' | 'preview'

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

  // Build query
  let query = supabase
    .from('vercel_deployments')
    .select('*')
    .eq('site_id', id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (target) {
    query = query.eq('target', target);
  }

  const { data: deployments, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    deployments: deployments || [],
  });
}

/**
 * POST /api/sites/[id]/vercel/deployments
 * Sync deployments from Vercel API
 */
export async function POST(
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

  // Get site with Vercel credentials
  const { data: site } = await supabase
    .from('sites')
    .select('id, vercel_project_id, vercel_team_id, vercel_token_encrypted')
    .eq('id', id)
    .eq('tenant_id', user.current_tenant_id)
    .single();

  if (!site) {
    return NextResponse.json({ error: 'Sito non trovato' }, { status: 404 });
  }

  if (!site.vercel_token_encrypted || !site.vercel_project_id) {
    return NextResponse.json(
      { error: 'Sito non collegato a Vercel' },
      { status: 400 }
    );
  }

  try {
    const vercel = new VercelClient(
      site.vercel_token_encrypted,
      site.vercel_team_id || undefined
    );

    const { deployments } = await vercel.listDeployments(site.vercel_project_id, {
      limit: 20,
    });

    let synced = 0;

    for (const deployment of deployments) {
      const gitInfo = extractGitInfo(deployment.meta);

      const { error } = await supabase.from('vercel_deployments').upsert(
        {
          site_id: id,
          tenant_id: user.current_tenant_id,
          deployment_id: deployment.uid,
          deployment_url: deployment.url ? `https://${deployment.url}` : null,
          state: deployment.state,
          target: deployment.target,
          git_branch: gitInfo?.branch || null,
          git_commit_sha: gitInfo?.sha || null,
          git_commit_message: gitInfo?.message || null,
          git_commit_author: gitInfo?.author || null,
          created_at: new Date(deployment.createdAt).toISOString(),
          ready_at: deployment.ready ? new Date(deployment.ready).toISOString() : null,
          build_duration_ms: calculateBuildDuration(deployment),
          error_message: deployment.errorMessage || null,
          meta: deployment.meta || {},
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'site_id,deployment_id' }
      );

      if (!error) {
        synced++;
      }
    }

    // Update last sync time
    await supabase
      .from('sites')
      .update({ vercel_last_sync: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      synced,
      total: deployments.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    console.error('Vercel sync error:', error);
    return NextResponse.json(
      { error: `Errore durante la sincronizzazione: ${message}` },
      { status: 500 }
    );
  }
}

// Helper functions
function extractGitInfo(meta?: Record<string, unknown>) {
  if (!meta) return null;

  if (meta.githubCommitSha) {
    return {
      branch: (meta.githubCommitRef as string) || null,
      sha: meta.githubCommitSha as string,
      message: (meta.githubCommitMessage as string) || null,
      author: (meta.githubCommitAuthorName as string) || null,
    };
  }

  if (meta.gitlabCommitSha) {
    return {
      branch: (meta.gitlabCommitRef as string) || null,
      sha: meta.gitlabCommitSha as string,
      message: (meta.gitlabCommitMessage as string) || null,
      author: (meta.gitlabCommitAuthorName as string) || null,
    };
  }

  if (meta.bitbucketCommitSha) {
    return {
      branch: (meta.bitbucketCommitRef as string) || null,
      sha: meta.bitbucketCommitSha as string,
      message: (meta.bitbucketCommitMessage as string) || null,
      author: (meta.bitbucketCommitAuthorName as string) || null,
    };
  }

  return null;
}

function calculateBuildDuration(deployment: { ready?: number; buildingAt?: number }): number | null {
  if (!deployment.ready || !deployment.buildingAt) {
    return null;
  }
  return deployment.ready - deployment.buildingAt;
}
