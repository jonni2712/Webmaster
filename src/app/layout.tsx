import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth/providers';
import { Toaster } from '@/components/ui/sonner';
import { CookieBanner } from '@/components/cookie-banner';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://webmaster-monitor.it';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Webmaster Monitor - Monitoraggio Siti Web 24/7',
    template: '%s | Webmaster Monitor',
  },
  description: 'Piattaforma professionale di monitoraggio per siti WordPress e PrestaShop. Uptime, SSL, performance e notifiche in tempo reale per webmaster e agenzie.',
  keywords: [
    'monitoraggio siti web',
    'uptime monitoring',
    'ssl monitoring',
    'wordpress monitoring',
    'prestashop monitoring',
    'web performance',
    'core web vitals',
    'notifiche downtime',
    'webmaster tools',
    'site monitoring',
  ],
  authors: [{ name: 'Webmaster Monitor' }],
  creator: 'Webmaster Monitor',
  publisher: 'Webmaster Monitor',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: siteUrl,
    siteName: 'Webmaster Monitor',
    title: 'Webmaster Monitor - Monitoraggio Siti Web 24/7',
    description: 'Piattaforma professionale di monitoraggio per siti WordPress e PrestaShop. Uptime, SSL, performance e notifiche in tempo reale.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Webmaster Monitor - Monitoraggio Siti Web',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Webmaster Monitor - Monitoraggio Siti Web 24/7',
    description: 'Piattaforma professionale di monitoraggio per siti WordPress e PrestaShop. Uptime, SSL, performance e notifiche in tempo reale.',
    images: ['/og-image.png'],
    creator: '@webmastermon',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // Da sostituire con il codice reale
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.className} ${GeistMono.variable}`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <CookieBanner />
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
