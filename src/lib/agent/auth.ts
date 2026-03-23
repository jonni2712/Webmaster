import { createAdminClient } from '@/lib/supabase/admin';
import { isValidTokenFormat } from './token';

interface AgentAuthResult {
  success: boolean;
  serverId?: string;
  tenantId?: string;
  error?: string;
}

/**
 * Authenticates an agent request by validating the Bearer token
 * against the servers table. Returns server and tenant IDs on success.
 */
export async function authenticateAgent(request: Request): Promise<AgentAuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, error: 'Missing Authorization header' };
  }

  const token = authHeader.slice(7);
  if (!isValidTokenFormat(token)) {
    return { success: false, error: 'Invalid token format' };
  }

  const supabase = createAdminClient();
  const { data: server, error } = await supabase
    .from('servers')
    .select('id, tenant_id, agent_token, agent_status')
    .eq('agent_token', token)
    .single();

  if (error || !server) {
    return { success: false, error: 'Unknown agent token' };
  }

  return {
    success: true,
    serverId: server.id,
    tenantId: server.tenant_id,
  };
}
