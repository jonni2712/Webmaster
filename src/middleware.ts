import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes che non richiedono autenticazione
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
];

// Estensioni file statici pubblici (immagini, font, ecc.)
const publicFileExtensions = [
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.css',
  '.js',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Salta controllo per assets Next.js
  if (pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Salta controllo per cron jobs (protetti da CRON_SECRET)
  if (pathname.startsWith('/api/cron')) {
    return NextResponse.next();
  }

  // Controlla se è un file statico pubblico (solo estensioni specifiche)
  const isPublicStaticFile = publicFileExtensions.some(ext =>
    pathname.toLowerCase().endsWith(ext)
  );
  if (isPublicStaticFile) {
    return NextResponse.next();
  }

  // Controlla se è una route pubblica
  const isPublicRoute = pathname === '/' ||
    publicRoutes.slice(1).some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // BLOCCA download di file protetti (es. plugin ZIP)
  if (pathname.startsWith('/downloads')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Autenticazione richiesta per scaricare questo file' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Get NextAuth token per tutte le altre routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session is valid
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
