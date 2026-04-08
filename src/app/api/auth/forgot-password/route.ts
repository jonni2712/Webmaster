import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/auth/tokens';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { sendEmail } from '@/lib/email/client';
import { ResetPasswordTemplate } from '@/lib/email/templates/reset-password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const supabase = createAdminClient();

    // Get user by email
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "Se l'email esiste, riceverai le istruzioni per reimpostare la password.",
      });
    }

    // Check if user has password credentials
    const { data: authCreds } = await supabase
      .from('auth_credentials')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!authCreds) {
      // User only has OAuth, don't send reset email
      // But still return success to prevent enumeration
      return NextResponse.json({
        success: true,
        message:
          "Se l'email esiste, riceverai le istruzioni per reimpostare la password.",
      });
    }

    // Generate reset token
    const token = await generateToken(user.id, 'password_reset');
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    // Send reset email (SMTP if configured, Resend as fallback)
    await sendEmail({
      to: email,
      subject: 'Reimposta la tua password - Webmaster Monitor',
      react: ResetPasswordTemplate({
        userName: user.name || '',
        resetUrl,
      }),
    });

    return NextResponse.json({
      success: true,
      message:
        "Se l'email esiste, riceverai le istruzioni per reimpostare la password.",
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
