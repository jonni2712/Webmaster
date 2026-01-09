import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/auth/tokens';
import { resend, EMAIL_FROM } from '@/lib/email/client';
import { VerifyEmailTemplate } from '@/lib/email/templates/verify-email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email richiesta' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email_verified')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent enumeration
    if (!user || user.email_verified) {
      return NextResponse.json({
        success: true,
        message:
          "Se l'account richiede verifica, riceverai una nuova email.",
      });
    }

    // Rate limiting check (check last token creation)
    const { data: recentToken } = await supabase
      .from('auth_tokens')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('type', 'email_verification')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentToken) {
      const lastSent = new Date(recentToken.created_at);
      const cooldownMinutes = 2;
      const cooldownEnd = new Date(
        lastSent.getTime() + cooldownMinutes * 60 * 1000
      );

      if (new Date() < cooldownEnd) {
        return NextResponse.json(
          {
            error: `Attendi ${cooldownMinutes} minuti prima di richiedere una nuova email`,
          },
          { status: 429 }
        );
      }
    }

    // Generate new token
    const token = await generateToken(user.id, 'email_verification');
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    if (resend) {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: 'Verifica il tuo indirizzo email - Webmaster Monitor',
        react: VerifyEmailTemplate({
          userName: user.name || '',
          verificationUrl,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email di verifica inviata!',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
