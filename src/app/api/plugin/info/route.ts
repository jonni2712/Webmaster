import { NextResponse } from 'next/server';

// Plugin version - update this when releasing new versions
const PLUGIN_VERSION = '1.0.1';
const PLUGIN_SLUG = 'webmaster-monitor';
const PLUGIN_NAME = 'Webmaster Monitor';

// GitHub repository for releases
const GITHUB_REPO = 'jonni2712/webmaster-monitor-plugin';

// Plugin metadata for WordPress update checker
const pluginInfo = {
  name: PLUGIN_NAME,
  slug: PLUGIN_SLUG,
  version: PLUGIN_VERSION,
  author: 'Webmaster Monitor',
  author_profile: 'https://webmaster-monitor.com',
  homepage: 'https://webmaster-monitor.com/plugin',
  requires: '5.0',
  tested: '6.7',
  requires_php: '7.4',
  download_url: `https://github.com/${GITHUB_REPO}/releases/download/v${PLUGIN_VERSION}/${PLUGIN_SLUG}.zip`,
  sections: {
    description: `
      <p>Collega il tuo sito WordPress alla piattaforma Webmaster Monitor per:</p>
      <ul>
        <li>Monitoraggio uptime e performance</li>
        <li>Controllo certificati SSL</li>
        <li>Gestione aggiornamenti plugin, temi e core</li>
        <li>Notifiche in tempo reale</li>
      </ul>
    `,
    installation: `
      <ol>
        <li>Scarica e installa il plugin</li>
        <li>Attiva il plugin dalla pagina Plugin</li>
        <li>Vai su Impostazioni > Webmaster Monitor</li>
        <li>Copia la API Key e inseriscila nella piattaforma</li>
      </ol>
    `,
    changelog: `
      <h4>1.0.1</h4>
      <ul>
        <li>Aggiunto sistema di auto-update</li>
        <li>Migliorata raccolta dati aggiornamenti</li>
        <li>Fix minori</li>
      </ul>
      <h4>1.0.0</h4>
      <ul>
        <li>Prima release pubblica</li>
        <li>Monitoraggio server e WordPress</li>
        <li>Integrazione con piattaforma Webmaster Monitor</li>
      </ul>
    `,
  },
  banners: {
    low: 'https://webmaster-monitor.com/plugin/banner-772x250.png',
    high: 'https://webmaster-monitor.com/plugin/banner-1544x500.png',
  },
  icons: {
    '1x': 'https://webmaster-monitor.com/plugin/icon-128x128.png',
    '2x': 'https://webmaster-monitor.com/plugin/icon-256x256.png',
  },
};

export async function GET() {
  return NextResponse.json(pluginInfo, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}

// POST endpoint for WordPress update check (compatibility)
export async function POST() {
  return NextResponse.json(pluginInfo, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
