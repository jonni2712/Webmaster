import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/tokens';
import { registerSchema } from '@/lib/validations/auth';
import { sendEmail } from '@/lib/email/client';
import { VerifyEmailTemplate } from '@/lib/email/templates/verify-email';
import {
  checkRateLimit,
  getClientIp,
  AUTH_RATE_LIMITS,
  rateLimitResponse,
} from '@/lib/rate-limit';
import { getPlan } from '@/lib/billing/plans';

/**
 * Generates a URL-safe slug from a string, falling back to a random suffix if empty.
 */
function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/**
 * Generates a tenant slug that is unique in the DB.
 * If the base slug collides, appends -2, -3, ... until free.
 */
async function generateUniqueTenantSlug(
  supabase: ReturnType<typeof createAdminClient>,
  base: string
): Promise<string> {
  const normalized = toSlug(base) || `workspace-${Date.now().toString(36)}`;
  let candidate = normalized;
  let suffix = 1;

  while (suffix < 50) {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!data) return candidate;
    suffix += 1;
    candidate = `${normalized}-${suffix}`;
  }

  // Extremely unlikely: fall back to a random suffix.
  return `${normalized}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 3 signups per IP in 10 minutes.
    const ip = getClientIp(request);
    const rl = await checkRateLimit({
      name: 'register',
      identifier: `ip:${ip}`,
      ...AUTH_RATE_LIMITS.register,
    });
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dati non validi', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const displayName = (name && name.trim().length > 0) ? name.trim() : null;

    const supabase = createAdminClient();

    // Check if the email is already registered.
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      // Return 409 so the UI can show a clear message.
      // This does leak existence of email, but signup pages typically do —
      // /forgot-password and /login use enumeration-safe responses where it matters.
      return NextResponse.json(
        { error: 'Un account con questa email esiste già' },
        { status: 409 }
      );
    }

    // Create a dedicated tenant (workspace) for this user.
    // Each signup gets its own isolated multi-tenant workspace.
    const tenantSlug = await generateUniqueTenantSlug(
      supabase,
      displayName || normalizedEmail.split('@')[0]
    );
    const tenantName = displayName
      ? `${displayName}'s Workspace`
      : `${normalizedEmail.split('@')[0]}'s Workspace`;

    // Load the free plan so that limits (max_sites, etc.) come from the
    // centralized plans table instead of being hardcoded here.
    const freePlan = await getPlan('free');
    if (!freePlan) {
      console.error('Failed to load free plan from database');
      return NextResponse.json(
        { error: 'Configurazione piani non disponibile' },
        { status: 500 }
      );
    }

    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: tenantName,
        slug: tenantSlug,
        plan: freePlan.id,
        plan_id: freePlan.id,
        max_sites: freePlan.maxSites, // Legacy column, kept in sync
      })
      .select('id')
      .single();

    if (tenantError || !newTenant) {
      console.error('Failed to create tenant:', tenantError);
      return NextResponse.json(
        { error: 'Errore nella creazione del workspace' },
        { status: 500 }
      );
    }

    // Create the user record.
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        name: displayName,
        current_tenant_id: newTenant.id,
        email_verified: null, // Must verify via email link
      })
      .select('id')
      .single();

    if (userError || !newUser) {
      console.error('Failed to create user:', userError);
      // Rollback the tenant we just created to avoid orphans.
      await supabase.from('tenants').delete().eq('id', newTenant.id);
      return NextResponse.json(
        { error: 'Errore nella creazione dell\'account' },
        { status: 500 }
      );
    }

    // Link user to their tenant with the owner role.
    const { error: membershipError } = await supabase
      .from('user_tenants')
      .insert({
        user_id: newUser.id,
        tenant_id: newTenant.id,
        role: 'owner',
      });

    if (membershipError) {
      console.error('Failed to create user_tenants:', membershipError);
      // Rollback user + tenant.
      await supabase.from('users').delete().eq('id', newUser.id);
      await supabase.from('tenants').delete().eq('id', newTenant.id);
      return NextResponse.json(
        { error: 'Errore nella configurazione del workspace' },
        { status: 500 }
      );
    }

    // Store the password hash.
    const passwordHash = await hashPassword(password);
    const { error: credsError } = await supabase
      .from('auth_credentials')
      .insert({
        user_id: newUser.id,
        password_hash: passwordHash,
      });

    if (credsError) {
      console.error('Failed to store credentials:', credsError);
      // Rollback everything.
      await supabase.from('user_tenants').delete().eq('user_id', newUser.id);
      await supabase.from('users').delete().eq('id', newUser.id);
      await supabase.from('tenants').delete().eq('id', newTenant.id);
      return NextResponse.json(
        { error: 'Errore nel salvataggio delle credenziali' },
        { status: 500 }
      );
    }

    // Generate and send verification email.
    try {
      const token = await generateToken(newUser.id, 'email_verification');
      const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

      const result = await sendEmail({
        to: normalizedEmail,
        subject: 'Verifica il tuo indirizzo email - Webmaster Monitor',
        react: VerifyEmailTemplate({
          userName: displayName || '',
          verificationUrl: verifyUrl,
        }),
      });

      if (!result.success) {
        console.warn(
          `[register] Failed to send verification email (backend=${result.backend}) - link for ${normalizedEmail}: ${verifyUrl}`
        );
      }
    } catch (emailError) {
      // Don't fail the registration if the email fails to send —
      // the user can trigger resend from /verify-email page.
      console.error('Failed to send verification email:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Account creato con successo. Controlla la tua email per verificare l\'indirizzo.',
        email: normalizedEmail,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
