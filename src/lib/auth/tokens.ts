import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export type TokenType = 'email_verification' | 'password_reset';

export async function generateToken(
  userId: string,
  type: TokenType
): Promise<string> {
  const supabase = createAdminClient();
  const token = crypto.randomBytes(32).toString('hex');

  const expiryHours =
    type === 'email_verification'
      ? VERIFICATION_TOKEN_EXPIRY_HOURS
      : RESET_TOKEN_EXPIRY_HOURS;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  // Invalidate existing tokens of the same type for this user
  await supabase
    .from('auth_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('type', type);

  // Create new token
  const { error } = await supabase.from('auth_tokens').insert({
    user_id: userId,
    token,
    type,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error('Failed to generate token');
  }

  return token;
}

export async function validateToken(
  token: string,
  type: TokenType
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('auth_tokens')
    .select('*')
    .eq('token', token)
    .eq('type', type)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Token non trovato' };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'Token scaduto' };
  }

  if (data.used_at) {
    return { valid: false, error: 'Token già utilizzato' };
  }

  return { valid: true, userId: data.user_id };
}

export async function markTokenAsUsed(token: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('auth_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);
}
