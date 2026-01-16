import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { VercelClient } from '@/lib/vercel/client';
import { z } from 'zod';

const connectSchema = z.object({
  vercel_token: z.string().min(1),
  vercel_project_id: z.string().min(1),
  vercel_team_id: z.string().optional(),
});

/**
 * POST /api/sites/[id]/vercel/connect
 * Connect a site to a Vercel project
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

  try {
    const body = await request.json();
    const validation = connectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { vercel_token, vercel_project_id, vercel_team_id } = validation.data;
    const supabase = createAdminClient();

    // Verify user has permission
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

    // Verify site belongs to tenant and is a Next.js site
    const { data: site } = await supabase
      .from('sites')
      .select('id, platform')
      .eq('id', id)
      .eq('tenant_id', user.current_tenant_id)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Sito non trovato' }, { status: 404 });
    }

    if (site.platform !== 'nextjs') {
      return NextResponse.json(
        { error: 'L\'integrazione Vercel e\' disponibile solo per siti Next.js' },
        { status: 400 }
      );
    }

    // Verify Vercel credentials
    const vercel = new VercelClient(vercel_token, vercel_team_id);

    try {
      // Verify token by getting user info
      await vercel.getUser();

      // Verify project exists and is accessible
      const project = await vercel.getProject(vercel_project_id);

      // Generate webhook secret for deployment notifications
      const webhookSecret = crypto.randomUUID();

      // Update site with Vercel integration
      const { error: updateError } = await supabase
        .from('sites')
        .update({
          vercel_project_id: project.id,
          vercel_team_id: vercel_team_id || null,
          vercel_token_encrypted: vercel_token, // TODO: encrypt in production
          vercel_webhook_secret: webhookSecret,
          vercel_last_sync: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Fetch initial deployments
      const { deployments } = await vercel.listDeployments(project.id, { limit: 10 });

      // Store deployments
      for (const deployment of deployments) {
        const gitInfo = extractGitInfo(deployment.meta);

        await supabase.from('vercel_deployments').upsert(
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
          },
          { onConflict: 'site_id,deployment_id' }
        );
      }

      return NextResponse.json({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          framework: project.framework,
        },
        deployments_synced: deployments.length,
        webhook_secret: webhookSecret,
      });
    } catch (vercelError: unknown) {
      const message = vercelError instanceof Error ? vercelError.message : 'Errore sconosciuto';
      return NextResponse.json(
        { error: `Errore di connessione a Vercel: ${message}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('POST /api/sites/[id]/vercel/connect error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Helper functions imported from client
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
