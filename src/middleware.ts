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
  // Pagine legali e istituzionali
  '/privacy',
  '/terms',
  '/cookies',
  '/gdpr',
  '/contact',
  // SEO
  '/sitemap.xml',
  '/robots.txt',
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

  // Salta controllo per plugin info (endpoint pubblico per update checker)
  if (pathname.startsWith('/api/plugin')) {
    return NextResponse.next();
  }

  // Salta controllo per health check (deve essere sempre accessibile
  // da external monitor senza autenticazione)
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  // TEMP: debug endpoint protetto da DEBUG_EMAIL_SECRET (rimuovere dopo)
  if (pathname.startsWith('/api/debug/')) {
    return NextResponse.next();
  }

  // Salta controllo per agent routes che usano Bearer token auth (non NextAuth session)
  // /api/agent/register e /api/agent/imports richiedono sessione utente e NON sono qui
  if (
    pathname === '/api/agent/sync' ||
    pathname === '/api/agent/heartbeat' ||
    pathname === '/api/agent/event'
  ) {
    return NextResponse.next();
  }

  // Sentry tunnel route (bypassa ad-blocker, gestito da @sentry/nextjs)
  if (pathname.startsWith('/monitoring')) {
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
