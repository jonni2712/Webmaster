import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/password';
import { validateToken, markTokenAsUsed } from '@/lib/auth/tokens';
import { resetPasswordSchema } from '@/lib/validations/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, token } = resetPasswordSchema.parse(body);

    // Validate token
    const result = await validateToken(token, 'password_reset');

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || 'Token non valido o scaduto' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password
    const { error } = await supabase
      .from('auth_credentials')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', result.userId);

    if (error) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        { error: 'Errore nel reimpostare la password' },
        { status: 500 }
      );
    }

    // Mark token as used
    await markTokenAsUsed(token);

    return NextResponse.json({
      success: true,
      message: 'Password reimpostata con successo!',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
