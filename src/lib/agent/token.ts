import { randomBytes, createHmac } from 'crypto';

const TOKEN_PREFIX = 'wm_agent_';

/**
 * Generates a secure agent token for server authentication.
 * Format: wm_agent_<random>_<hmac>
 */
export function generateAgentToken(serverId: string): string {
  const random = randomBytes(24).toString('hex');
  const hmac = createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback-secret')
    .update(`${serverId}:${random}`)
    .digest('hex')
    .slice(0, 16);
  return `${TOKEN_PREFIX}${random}_${hmac}`;
}

/**
 * Validates token format (not DB lookup — just structural check).
 */
export function isValidTokenFormat(token: string): boolean {
  return token.startsWith(TOKEN_PREFIX) && token.length > TOKEN_PREFIX.length + 40;
}
