import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/tokens';
import { registerSchema } from '@/lib/validations/auth';
import { resend, EMAIL_FROM } from '@/lib/email/client';
import { VerifyEmailTemplate } from '@/lib/email/templates/verify-email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const supabase = createAdminClient();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('email', validatedData.email.toLowerCase())
      .single();

    if (existingUser) {
      // Check if user has credentials (password account)
      const { data: existingCreds } = await supabase
        .from('auth_credentials')
        .select('id')
        .eq('user_id', existingUser.id)
        .single();

      if (existingCreds) {
        return NextResponse.json(
          { error: 'Un account con questa email esiste già' },
          { status: 409 }
        );
      }

      // User exists via OAuth, allow adding password credentials
      const passwordHash = await hashPassword(validatedData.password);

      await supabase.from('auth_credentials').insert({
        user_id: existingUser.id,
        password_hash: passwordHash,
      });

      // If not verified, send verification email
      if (!existingUser.email_verified) {
        const token = await generateToken(existingUser.id, 'email_verification');
        const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

        if (resend) {
          await resend.emails.send({
            from: EMAIL_FROM,
            to: validatedData.email,
            subject: 'Verifica il tuo indirizzo email - Webmaster Monitor',
            react: VerifyEmailTemplate({
              userName: validatedData.name || '',
              verificationUrl,
            }),
          });
        }

        return NextResponse.json({
          success: true,
          message:
            "Password aggiunta. Controlla la tua email per verificare l'account.",
          requiresVerification: true,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Password aggiunta al tuo account.',
      });
    }

    // Create new user
    const passwordHash = await hashPassword(validatedData.password);

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: validatedData.email.toLowerCase(),
        name: validatedData.name || null,
        email_verified: null, // Not verified yet
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: "Errore nella creazione dell'account" },
        { status: 500 }
      );
    }

    // Add password credentials
    await supabase.from('auth_credentials').insert({
      user_id: newUser.id,
      password_hash: passwordHash,
    });

    // Add user to default tenant
    await supabase.from('user_tenants').insert({
      user_id: newUser.id,
      tenant_id: '00000000-0000-0000-0000-000000000001',
      role: 'owner',
    });

    // Generate verification token and send email
    const token = await generateToken(newUser.id, 'email_verification');
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    if (resend) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: validatedData.email,
        subject: 'Verifica il tuo indirizzo email - Webmaster Monitor',
        react: VerifyEmailTemplate({
          userName: validatedData.name || '',
          verificationUrl,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Account creato! Controlla la tua email per verificare l'account.",
      requiresVerification: true,
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dati non validi', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
