import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'webmaster2024';
const SESSION_COOKIE = 'webmaster_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 giorni

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password richiesta' },
        { status: 400 }
      );
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Password non valida' },
        { status: 401 }
      );
    }

    // Crea sessione
    const sessionToken = Buffer.from(
      JSON.stringify({
        authenticated: true,
        createdAt: Date.now(),
      })
    ).toString('base64');

    // Imposta cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}
