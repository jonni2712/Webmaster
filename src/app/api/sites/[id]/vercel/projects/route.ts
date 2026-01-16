import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { VercelClient } from '@/lib/vercel/client';
import { z } from 'zod';

const listProjectsSchema = z.object({
  token: z.string().min(1),
  team_id: z.string().optional(),
});

/**
 * POST /api/sites/[id]/vercel/projects
 * List available Vercel projects for connection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = listProjectsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Token Vercel richiesto' },
        { status: 400 }
      );
    }

    const { token, team_id } = validation.data;
    const vercel = new VercelClient(token, team_id);

    try {
      // Verify token
      const user = await vercel.getUser();

      // Get projects
      const { projects } = await vercel.listProjects();

      // Get teams if available
      let teams: { id: string; name: string; slug: string }[] = [];
      try {
        const teamsResponse = await vercel.listTeams();
        teams = teamsResponse.teams || [];
      } catch {
        // User might not have team access
      }

      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          framework: p.framework,
          repo: p.link?.repo || null,
        })),
        teams,
      });
    } catch (vercelError: unknown) {
      const message = vercelError instanceof Error ? vercelError.message : 'Errore sconosciuto';
      return NextResponse.json(
        { error: `Errore Vercel: ${message}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('POST /api/sites/[id]/vercel/projects error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
