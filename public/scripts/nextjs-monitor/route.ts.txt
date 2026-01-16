/**
 * Webmaster Monitor - API Route per Next.js
 *
 * Copia questo file in: /app/api/webmaster-monitor/status/route.ts
 *
 * Variabili d'ambiente richieste (.env.local):
 * - WEBMASTER_MONITOR_SITE_ID: ID del sito dalla piattaforma
 * - WEBMASTER_MONITOR_API_KEY: API key generata dalla piattaforma
 * - WEBMASTER_MONITOR_URL: (opzionale) URL della piattaforma
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectStatus, sendStatus, type MonitorStatus } from '@/lib/webmaster-monitor';

// Configurazione
const config = {
  siteId: process.env.WEBMASTER_MONITOR_SITE_ID || '',
  apiKey: process.env.WEBMASTER_MONITOR_API_KEY || '',
  apiUrl: process.env.WEBMASTER_MONITOR_URL || 'https://webmaster-monitor.com',
};

// Health checks personalizzati (opzionale)
// Aggiungi qui i tuoi controlli di salute personalizzati
const customHealthChecks: Record<string, () => Promise<boolean>> = {
  // Esempio: verifica connessione database
  // database: async () => {
  //   try {
  //     await prisma.$queryRaw`SELECT 1`;
  //     return true;
  //   } catch {
  //     return false;
  //   }
  // },

  // Esempio: verifica servizio esterno
  // external_api: async () => {
  //   try {
  //     const res = await fetch('https://api.example.com/health');
  //     return res.ok;
  //   } catch {
  //     return false;
  //   }
  // },
};

/**
 * GET /api/webmaster-monitor/status
 * Restituisce lo stato attuale del sito
 */
export async function GET(request: NextRequest) {
  // Verifica autorizzazione
  const authHeader = request.headers.get('x-wm-api-key');

  // Permetti accesso solo con API key valida o dalla piattaforma
  if (authHeader && authHeader !== config.apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await collectStatus(customHealthChecks);
    return NextResponse.json(status);
  } catch (error) {
    console.error('Webmaster Monitor error:', error);
    return NextResponse.json(
      { error: 'Failed to collect status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webmaster-monitor/status
 * Forza l'invio dello stato alla piattaforma
 */
export async function POST(request: NextRequest) {
  // Verifica autorizzazione
  const authHeader = request.headers.get('x-wm-api-key');

  if (!authHeader || authHeader !== config.apiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!config.siteId || !config.apiKey) {
    return NextResponse.json(
      { error: 'Missing configuration. Set WEBMASTER_MONITOR_SITE_ID and WEBMASTER_MONITOR_API_KEY' },
      { status: 500 }
    );
  }

  try {
    const result = await sendStatus(config, customHealthChecks);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Status sent successfully' });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Webmaster Monitor send error:', error);
    return NextResponse.json(
      { error: 'Failed to send status' },
      { status: 500 }
    );
  }
}
