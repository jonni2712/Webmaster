import { NextAuthOptions } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPassword } from './password';
import { checkRateLimit, AUTH_RATE_LIMITS } from '@/lib/rate-limit';

/**
 * Extracts client IP from NextAuth's internal request object.
 * Falls back to "unknown" so rate limiting still happens against a
 * stable per-deployment key when no forwarded header is present.
 */
function getIpFromNextAuthReq(req: unknown): string {
  if (!req || typeof req !== 'object') return 'unknown';
  const headers = (req as { headers?: Record<string, string | string[]> })
    .headers;
  if (!headers) return 'unknown';
  const xff = headers['x-forwarded-for'];
  const xffValue = Array.isArray(xff) ? xff[0] : xff;
  if (xffValue) {
    const first = xffValue.split(',')[0]?.trim();
    if (first) return first;
  }
  const xri = headers['x-real-ip'];
  const xriValue = Array.isArray(xri) ? xri[0] : xri;
  if (xriValue) return xriValue.trim();
  return 'unknown';
}

// Session durations
const DEFAULT_SESSION_MAX_AGE = 24 * 60 * 60; // 1 day
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// Conditionally enable OAuth providers only if credentials are configured.
// Without this guard, NextAuth would initialize providers with `undefined`
// clientId/clientSecret and crash at runtime.
const providers: Provider[] = [];

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

providers.push(
  CredentialsProvider({
      id: 'credentials',
      name: 'Email e Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Ricordami', type: 'checkbox' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e password richiesti');
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const ip = getIpFromNextAuthReq(req);

        // Rate limit by IP (coarse abuse prevention).
        const ipLimit = await checkRateLimit({
          name: 'login_ip',
          identifier: `ip:${ip}`,
          ...AUTH_RATE_LIMITS.login,
        });
        if (!ipLimit.allowed) {
          throw new Error('Troppi tentativi di accesso. Riprova più tardi.');
        }

        // Rate limit by email (targeted brute-force prevention).
        const emailLimit = await checkRateLimit({
          name: 'login_email',
          identifier: `email:${normalizedEmail}`,
          ...AUTH_RATE_LIMITS.loginEmail,
        });
        if (!emailLimit.allowed) {
          throw new Error('Troppi tentativi di accesso. Riprova più tardi.');
        }

        const supabase = createAdminClient();

        // Get user by email
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, email, name, avatar_url, email_verified')
          .eq('email', normalizedEmail)
          .single();

        if (userError || !user) {
          throw new Error('Credenziali non valide');
        }

        // Check if email is verified
        if (!user.email_verified) {
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        // Get password credentials
        const { data: authCreds, error: credsError } = await supabase
          .from('auth_credentials')
          .select('password_hash')
          .eq('user_id', user.id)
          .single();

        if (credsError || !authCreds) {
          // User exists but no password (OAuth only user)
          throw new Error(
            'Questo account usa login social. Accedi con GitHub o Google.'
          );
        }

        // Verify password
        const isValidPassword = await verifyPassword(
          credentials.password,
          authCreds.password_hash
        );

        if (!isValidPassword) {
          throw new Error('Credenziali non valide');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar_url,
        };
      },
    })
);

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // For credentials provider, user is already verified in authorize()
      if (account?.provider === 'credentials') {
        return true;
      }

      // OAuth flow - existing logic
      try {
        const supabase = createAdminClient();

        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!existingUser) {
          // Create a dedicated tenant (workspace) for the new OAuth user.
          // This mirrors the behavior of /api/auth/register and prevents
          // new signups from landing in the shared Personal tenant.
          const baseSlug = (user.name || user.email.split('@')[0])
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40) || `workspace-${Date.now().toString(36)}`;

          // Try to find a unique slug by appending -2, -3, ... if needed.
          let tenantSlug = baseSlug;
          for (let i = 2; i < 50; i++) {
            const { data: existing } = await supabase
              .from('tenants')
              .select('id')
              .eq('slug', tenantSlug)
              .maybeSingle();
            if (!existing) break;
            tenantSlug = `${baseSlug}-${i}`;
          }

          const tenantName = user.name
            ? `${user.name}'s Workspace`
            : `${user.email.split('@')[0]}'s Workspace`;

          const { data: newTenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
              name: tenantName,
              slug: tenantSlug,
              plan: 'free',
              max_sites: 3,
            })
            .select('id')
            .single();

          if (tenantError || !newTenant) {
            console.error('Error creating tenant for OAuth user:', tenantError);
            return false;
          }

          // Create the user record linked to their new tenant.
          const { data: newUser, error } = await supabase
            .from('users')
            .insert({
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              current_tenant_id: newTenant.id,
              email_verified: new Date().toISOString(), // OAuth = verified
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating user:', error);
            // Rollback the tenant to avoid an orphan.
            await supabase.from('tenants').delete().eq('id', newTenant.id);
            return false;
          }

          // Link user to their own tenant as owner.
          const { error: membershipError } = await supabase
            .from('user_tenants')
            .insert({
              user_id: newUser.id,
              tenant_id: newTenant.id,
              role: 'owner',
            });

          if (membershipError) {
            console.error('Error creating user_tenants:', membershipError);
            // Rollback user + tenant.
            await supabase.from('users').delete().eq('id', newUser.id);
            await supabase.from('tenants').delete().eq('id', newTenant.id);
            return false;
          }
        } else {
          // Update existing user
          await supabase
            .from('users')
            .update({
              name: user.name,
              avatar_url: user.image,
            })
            .eq('id', existingUser.id);
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        try {
          const supabase = createAdminClient();

          const { data: user } = await supabase
            .from('users')
            .select('id, current_tenant_id, email_verified')
            .eq('email', session.user.email!)
            .single();

          if (user) {
            session.user.id = user.id;
            session.user.currentTenantId = user.current_tenant_id;
            session.user.emailVerified = !!user.email_verified;
          }
        } catch (error) {
          console.error('Session callback error:', error);
        }
      }

      // Apply remember me duration
      if (token.rememberMe) {
        session.expires = new Date(
          Date.now() + REMEMBER_ME_MAX_AGE * 1000
        ).toISOString();
      }

      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      // Check for remember me from credentials login
      if (account?.provider === 'credentials') {
        // rememberMe is passed through the credentials
        token.rememberMe = true; // Will be overridden by actual value in signIn
      }

      return token;
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-email',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: DEFAULT_SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: REMEMBER_ME_MAX_AGE, // Max possible age
  },
};
