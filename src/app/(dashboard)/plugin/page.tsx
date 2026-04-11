'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  CheckCircle2,
  Copy,
  Server,
  Shield,
  Zap,
  Database,
  HardDrive,
  RefreshCw,
  ExternalLink,
  FileCode,
  Settings,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';

const pluginFeatures = [
  {
    icon: Server,
    title: 'Info Server',
    description: 'PHP, MySQL/MariaDB, web server, sistema operativo',
  },
  {
    icon: HardDrive,
    title: 'Spazio Disco',
    description: 'Spazio totale, usato, disponibile, dimensione WordPress',
  },
  {
    icon: FileCode,
    title: 'Plugin & Temi',
    description: 'Lista completa con versioni e aggiornamenti disponibili',
  },
  {
    icon: Shield,
    title: 'Sicurezza',
    description: 'API Key univoca, connessione HTTPS, autenticazione sicura',
  },
  {
    icon: Database,
    title: 'Database',
    description: 'Versione, charset, dimensione tabelle, numero tabelle',
  },
  {
    icon: Zap,
    title: 'Site Health',
    description: 'Integrazione con WordPress Site Health API',
  },
];

const installationSteps = [
  {
    step: 1,
    title: 'Scarica il plugin',
    description: 'Clicca il pulsante "Scarica Plugin" per ottenere il file ZIP.',
  },
  {
    step: 2,
    title: 'Carica su WordPress',
    description: 'Vai su Plugin > Aggiungi nuovo > Carica plugin e seleziona il file ZIP.',
  },
  {
    step: 3,
    title: 'Attiva il plugin',
    description: 'Dopo l\'installazione, clicca su "Attiva" per abilitare il plugin.',
  },
  {
    step: 4,
    title: 'Copia l\'API Key',
    description: 'Vai su Impostazioni > Webmaster Monitor e copia l\'API Key generata.',
  },
  {
    step: 5,
    title: 'Aggiungi il sito',
    description: 'Torna qui, vai su "Aggiungi Sito" e inserisci URL e API Key.',
  },
];

export default function PluginPage() {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    window.location.href = 'https://github.com/jonni2712/webmaster-monitor-plugin/releases/download/v1.0.2/webmaster-monitor.zip';
    toast.success('Download avviato!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copiato negli appunti!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Plugin WordPress"
        description="Scarica e configura il plugin per collegare i tuoi siti WordPress"
      />

      <div className="p-6 space-y-4">
      {/* Download Card */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-white/10 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Webmaster Monitor</p>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">v1.0.2</Badge>
                <span className="text-xs text-zinc-500">WordPress 5.0+</span>
                <span className="text-xs text-zinc-500">PHP 7.4+</span>
              </div>
            </div>
          </div>
          <Button size="sm" className="h-8 text-sm gap-1.5 w-full sm:w-auto" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Scarica Plugin
          </Button>
        </div>
      </div>

      <Tabs defaultValue="install" className="space-y-4">
        <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="install" className="text-xs sm:text-sm px-2 sm:px-3">Installazione</TabsTrigger>
          <TabsTrigger value="features" className="text-xs sm:text-sm px-2 sm:px-3">Funzionalita'</TabsTrigger>
          <TabsTrigger value="api" className="text-xs sm:text-sm px-2 sm:px-3">API Docs</TabsTrigger>
        </TabsList>

        {/* Installation Tab */}
        <TabsContent value="install" className="space-y-4">
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">Guida all&apos;Installazione</p>
            <p className="text-xs text-zinc-500 mb-4">Segui questi passaggi per collegare il tuo sito WordPress</p>
            <div className="space-y-4">
              {installationSteps.map((item, index) => (
                <div key={item.step} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold text-xs">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
                    {index < installationSteps.length - 1 && (
                      <div className="border-l-2 border-dashed border-zinc-200 dark:border-white/10 ml-[-15px] h-4 mt-3" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              <strong>Suggerimento:</strong> Dopo aver installato il plugin, puoi testare la connessione
              direttamente dalla pagina impostazioni di WordPress prima di aggiungere il sito alla piattaforma.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {pluginFeatures.map((feature) => (
              <div key={feature.title} className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-white/10 transition-colors">
                <div className="h-7 w-7 rounded-md bg-zinc-100 dark:bg-white/5 flex items-center justify-center mb-3">
                  <feature.icon className="h-3.5 w-3.5 text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{feature.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">Dati Raccolti</p>
            <p className="text-xs text-zinc-500 mb-4">Ecco tutti i dati che il plugin raccoglie e invia alla piattaforma</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5" /> Informazioni Server
                </p>
                <ul className="space-y-1.5">
                  {['Versione PHP e configurazione', 'Versione MySQL/MariaDB', 'Web server', 'Sistema operativo', 'Spazio disco e utilizzo', 'Estensioni PHP caricate'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-zinc-500">
                      <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5" /> Informazioni WordPress
                </p>
                <ul className="space-y-1.5">
                  {['Versione WordPress', 'Plugin installati e versioni', 'Temi installati e attivo', 'Aggiornamenti disponibili', 'Configurazione costanti WP', 'Stato Site Health'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-zinc-500">
                      <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* API Documentation Tab */}
        <TabsContent value="api" className="space-y-4">
          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6 space-y-6">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">Endpoint REST API</p>
              <p className="text-xs text-zinc-500">Il plugin espone i seguenti endpoint REST API</p>
            </div>
              <div>
                <p className="text-xs font-medium text-zinc-900 dark:text-white mb-1.5">Autenticazione</p>
                <p className="text-xs text-zinc-500 mb-2">
                  Tutte le richieste (eccetto /health) richiedono l&apos;API Key nell&apos;header:
                </p>
                <div className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 p-3 rounded-md font-mono text-xs flex items-center justify-between">
                  <code className="text-zinc-700 dark:text-zinc-300">X-WM-API-Key: wm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => copyToClipboard('X-WM-API-Key: your_api_key')}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { method: 'GET', path: '/wp-json/webmaster-monitor/v1/status', desc: 'Ritorna tutte le informazioni: server + WordPress', color: 'emerald' },
                  { method: 'GET', path: '/wp-json/webmaster-monitor/v1/server', desc: 'Ritorna solo informazioni server (PHP, DB, disco)', color: 'emerald' },
                  { method: 'GET', path: '/wp-json/webmaster-monitor/v1/wordpress', desc: 'Ritorna solo informazioni WordPress (core, plugin, temi)', color: 'emerald' },
                  { method: 'GET', path: '/wp-json/webmaster-monitor/v1/health', desc: 'Health check pubblico (no auth) - per uptime monitoring', color: 'blue' },
                  { method: 'GET', path: '/wp-json/webmaster-monitor/v1/ping', desc: "Test connessione - verifica che l'API Key sia valida", color: 'emerald' },
                ].map((ep) => (
                  <div key={ep.path} className="border border-zinc-200 dark:border-white/5 rounded-md p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${ep.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-blue-500/10 text-blue-600 border-blue-200'}`}>{ep.method}</Badge>
                      <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{ep.path}</code>
                    </div>
                    <p className="text-xs text-zinc-500">{ep.desc}</p>
                  </div>
                ))}
              </div>
          </div>

          <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-0.5">Esempio Risposta</p>
            <p className="text-xs text-zinc-500 mb-3">Esempio di risposta dall&apos;endpoint /status</p>
            <pre className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 p-4 rounded-md overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300">
{`{
  "plugin_version": "1.0.1",
  "timestamp": "2025-01-13T10:30:00+01:00",
  "server": {
    "php": {
      "version": "8.2.0",
      "memory_limit": "256M",
      "max_execution_time": "300"
    },
    "database": {
      "type": "MariaDB",
      "version": "10.6.12",
      "total_size": "45.2 MB"
    },
    "disk": {
      "total": "50 GB",
      "free": "32 GB",
      "used_percentage": 36
    }
  },
  "wordpress": {
    "core": {
      "version": "6.4.2",
      "update_available": false
    },
    "plugins": {
      "total": 12,
      "active": 8,
      "updates_available": 2
    },
    "themes": {
      "total": 3,
      "updates_available": 0
    }
  }
}`}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
