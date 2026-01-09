import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateToken, markTokenAsUsed } from '@/lib/auth/tokens';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token mancante' }, { status: 400 });
    }

    const result = await validateToken(token, 'email_verification');

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Token non valido' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Mark email as verified
    const { error } = await supabase
      .from('users')
      .update({ email_verified: new Date().toISOString() })
      .eq('id', result.userId);

    if (error) {
      console.error('Error verifying email:', error);
      return NextResponse.json(
        { error: "Errore nella verifica dell'email" },
        { status: 500 }
      );
    }

    // Mark token as used
    await markTokenAsUsed(token);

    return NextResponse.json({
      success: true,
      message: 'Email verificata con successo!',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
