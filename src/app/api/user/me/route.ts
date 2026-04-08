import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPassword } from '@/lib/auth/password';
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email/client';
import { AccountDeletedEmail } from '@/lib/email/templates/account-deleted';
import { createHash } from 'crypto';

/**
 * GDPR Article 17 — Right to Erasure (Right to be Forgotten).
 *
 * Deletes the authenticated user and cascades to everything they own.
 *
 * Safety rules:
 *   1. The request must include the user's current password (defense
 *      against session-hijack / CSRF deleting the account).
 *   2. If the user is the sole `owner` of a tenant with OTHER members,
 *      the request is rejected — the user must first transfer ownership
 *      or remove the other members. Otherwise we'd orphan them.
 *   3. If the user is the only member of their tenant(s), those tenants
 *      are deleted too (CASCADE takes care of sites, alerts, etc.).
 *   4. A minimal audit row is written to `deleted_users_audit` with a
 *      SHA-256 hash of the email (so we can prove compliance without
 *      retaining identifiable content).
 *   5. A confirmation email is sent to the user's now-deleted address
 *      so they know the action completed.
 *
 * This is irreversible — the API does NOT support undelete.
 */

export const maxDuration = 60;

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: max 3 delete attempts per hour per user (allows retries
  // if the password is wrong) and max 5 per IP per hour.
  const ip = getClientIp(request);
  const userLimit = await checkRateLimit({
    name: 'gdpr_delete_user',
    identifier: `user:${session.user.id}`,
    max: 3,
    windowSeconds: 3600,
  });
  if (!userLimit.allowed) return rateLimitResponse(userLimit);

  const ipLimit = await checkRateLimit({
    name: 'gdpr_delete_ip',
    identifier: `ip:${ip}`,
    max: 5,
    windowSeconds: 3600,
  });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit);

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  if (!body.password || typeof body.password !== 'string') {
    return NextResponse.json(
      { error: 'Password di conferma richiesta' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const userId = session.user.id;
  const userEmail = session.user.email;

  // 1. Load password hash
  const { data: authCreds, error: credsError } = await supabase
    .from('auth_credentials')
    .select('password_hash')
    .eq('user_id', userId)
    .maybeSingle();

  if (credsError || !authCreds) {
    // OAuth-only accounts don't have a password; we can't verify them
    // this way. Reject with a clear message — the user should use their
    // OAuth provider to revoke access and contact support.
    return NextResponse.json(
      {
        error:
          'Questo account usa login social. Contatta il supporto per eliminare il tuo account.',
      },
      { status: 400 }
    );
  }

  // 2. Verify password
  const passwordOk = await verifyPassword(body.password, authCreds.password_hash);
  if (!passwordOk) {
    return NextResponse.json(
      { error: 'Password non corretta' },
      { status: 403 }
    );
  }

  // 3. Load all tenants the user is part of
  const { data: memberships } = await supabase
    .from('user_tenants')
    .select('tenant_id, role')
    .eq('user_id', userId);

  const tenantIds = (memberships || []).map(
    (m) => (m as { tenant_id: string }).tenant_id
  );

  // 4. For each tenant where the user is `owner`, check if other members exist.
  //    If they do, refuse the delete with a clear list.
  const blockingTenants: Array<{ id: string; name: string; otherMembers: number }> = [];

  for (const m of memberships || []) {
    const mem = m as { tenant_id: string; role: string };
    if (mem.role !== 'owner') continue;

    const { count } = await supabase
      .from('user_tenants')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', mem.tenant_id)
      .neq('user_id', userId);

    if ((count ?? 0) > 0) {
      const { data: tenantRow } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', mem.tenant_id)
        .single();

      blockingTenants.push({
        id: mem.tenant_id,
        name: tenantRow?.name ?? mem.tenant_id,
        otherMembers: count ?? 0,
      });
    }
  }

  if (blockingTenants.length > 0) {
    return NextResponse.json(
      {
        error:
          'Sei ancora proprietario di workspace con altri membri. Trasferisci la proprietà o rimuovi gli altri membri prima di eliminare l\'account.',
        code: 'TENANT_OWNERSHIP_CONFLICT',
        blocking_tenants: blockingTenants,
      },
      { status: 409 }
    );
  }

  // 5. Determine which tenants should be deleted entirely (sole-owner
  //    tenants). Tenants where the user is a non-owner member are left
  //    alone — only their membership is removed.
  const tenantsToDelete: string[] = [];
  for (const m of memberships || []) {
    const mem = m as { tenant_id: string; role: string };
    if (mem.role === 'owner') {
      // Owner with no other members (we checked above) — delete the tenant.
      tenantsToDelete.push(mem.tenant_id);
    }
  }

  // 6. Write the audit trail BEFORE deleting anything so it survives
  //    even a partial failure.
  await supabase.from('deleted_users_audit').insert({
    email_hash: hashEmail(userEmail),
    tenant_ids: tenantsToDelete,
    deleted_from_ip: ip,
    reason: 'user_requested',
  });

  // 7. Delete the tenants (ON DELETE CASCADE handles sites, alerts, etc.)
  if (tenantsToDelete.length > 0) {
    await supabase.from('tenants').delete().in('id', tenantsToDelete);
  }

  // 8. Delete user_tenants rows for all other memberships.
  await supabase.from('user_tenants').delete().eq('user_id', userId);

  // 9. Delete auth credentials and tokens.
  await supabase.from('auth_credentials').delete().eq('user_id', userId);
  await supabase.from('auth_tokens').delete().eq('user_id', userId);

  // 10. Finally, delete the user row.
  const { error: userDeleteError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (userDeleteError) {
    console.error('[gdpr-delete] Failed to delete user row:', userDeleteError);
    return NextResponse.json(
      { error: 'Errore durante l\'eliminazione dell\'account' },
      { status: 500 }
    );
  }

  // 11. Fire-and-forget confirmation email. Don't fail the request if
  //     email delivery fails — the user's data is already gone.
  try {
    await sendEmail({
      to: userEmail,
      subject: 'Account eliminato — Webmaster Monitor',
      react: AccountDeletedEmail({
        userName: session.user.name || '',
      }),
    });
  } catch (emailErr) {
    console.error('[gdpr-delete] Confirmation email failed:', emailErr);
  }

  return NextResponse.json({
    success: true,
    message: 'Account eliminato con successo',
    tenants_deleted: tenantsToDelete.length,
  });
}
