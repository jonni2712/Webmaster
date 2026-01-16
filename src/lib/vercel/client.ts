/**
 * Vercel API Client
 * Handles communication with the Vercel API for deployment monitoring
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

export interface VercelApiDeployment {
  uid: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  target: 'production' | 'preview' | null;
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  meta?: {
    githubCommitRef?: string;
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
    gitlabCommitRef?: string;
    gitlabCommitSha?: string;
    gitlabCommitMessage?: string;
    gitlabCommitAuthorName?: string;
    bitbucketCommitRef?: string;
    bitbucketCommitSha?: string;
    bitbucketCommitMessage?: string;
    bitbucketCommitAuthorName?: string;
  };
  errorMessage?: string;
  inspectorUrl?: string;
}

export interface VercelApiProject {
  id: string;
  name: string;
  framework: string | null;
  link?: {
    type: 'github' | 'gitlab' | 'bitbucket';
    repo: string;
  };
  latestDeployments?: VercelApiDeployment[];
}

export interface VercelDeploymentsResponse {
  deployments: VercelApiDeployment[];
  pagination?: {
    count: number;
    next: number | null;
    prev: number | null;
  };
}

export class VercelClient {
  private token: string;
  private teamId?: string;

  constructor(token: string, teamId?: string) {
    this.token = token;
    this.teamId = teamId;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = new URL(`${VERCEL_API_BASE}${endpoint}`);

    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Vercel API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get current user/team info to verify token
   */
  async getUser(): Promise<{ id: string; username: string; email: string }> {
    return this.fetch('/v2/user');
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<{ projects: VercelApiProject[] }> {
    return this.fetch('/v9/projects');
  }

  /**
   * Get a specific project by ID or name
   */
  async getProject(projectId: string): Promise<VercelApiProject> {
    return this.fetch(`/v9/projects/${projectId}`);
  }

  /**
   * List deployments for a project
   */
  async listDeployments(
    projectId: string,
    options?: {
      limit?: number;
      target?: 'production' | 'preview';
      state?: string;
    }
  ): Promise<VercelDeploymentsResponse> {
    const params = new URLSearchParams();
    params.set('projectId', projectId);

    if (options?.limit) {
      params.set('limit', options.limit.toString());
    }
    if (options?.target) {
      params.set('target', options.target);
    }
    if (options?.state) {
      params.set('state', options.state);
    }

    return this.fetch(`/v6/deployments?${params.toString()}`);
  }

  /**
   * Get a specific deployment
   */
  async getDeployment(deploymentId: string): Promise<VercelApiDeployment> {
    return this.fetch(`/v13/deployments/${deploymentId}`);
  }

  /**
   * List teams (if token has access)
   */
  async listTeams(): Promise<{ teams: { id: string; name: string; slug: string }[] }> {
    return this.fetch('/v2/teams');
  }
}

/**
 * Extract git info from deployment meta
 */
export function extractGitInfo(meta?: VercelApiDeployment['meta']) {
  if (!meta) return null;

  // Try GitHub first
  if (meta.githubCommitSha) {
    return {
      branch: meta.githubCommitRef || null,
      sha: meta.githubCommitSha,
      message: meta.githubCommitMessage || null,
      author: meta.githubCommitAuthorName || null,
    };
  }

  // Try GitLab
  if (meta.gitlabCommitSha) {
    return {
      branch: meta.gitlabCommitRef || null,
      sha: meta.gitlabCommitSha,
      message: meta.gitlabCommitMessage || null,
      author: meta.gitlabCommitAuthorName || null,
    };
  }

  // Try Bitbucket
  if (meta.bitbucketCommitSha) {
    return {
      branch: meta.bitbucketCommitRef || null,
      sha: meta.bitbucketCommitSha,
      message: meta.bitbucketCommitMessage || null,
      author: meta.bitbucketCommitAuthorName || null,
    };
  }

  return null;
}

/**
 * Calculate build duration in milliseconds
 */
export function calculateBuildDuration(deployment: VercelApiDeployment): number | null {
  if (!deployment.ready || !deployment.buildingAt) {
    return null;
  }
  return deployment.ready - deployment.buildingAt;
}
