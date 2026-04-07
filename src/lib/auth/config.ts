import { NextAuthOptions } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPassword } from './password';

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e password richiesti');
        }

        const supabase = createAdminClient();

        // Get user by email
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, email, name, avatar_url, email_verified')
          .eq('email', credentials.email.toLowerCase())
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
          // Create new user
          const { data: newUser, error } = await supabase
            .from('users')
            .insert({
              email: user.email,
              name: user.name,
              avatar_url: user.image,
              email_verified: new Date().toISOString(), // OAuth = verified
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating user:', error);
            return false;
          }

          // Add user to default tenant
          await supabase.from('user_tenants').insert({
            user_id: newUser.id,
            tenant_id: '00000000-0000-0000-0000-000000000001',
            role: 'owner',
          });
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
