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
    window.location.href = '/downloads/webmaster-monitor.zip';
    toast.success('Download avviato!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copiato negli appunti!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plugin WordPress</h1>
        <p className="text-muted-foreground">
          Scarica e configura il plugin per collegare i tuoi siti WordPress
        </p>
      </div>

      {/* Download Card */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Webmaster Monitor</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">v1.0.0</Badge>
                  <span className="text-sm text-muted-foreground">WordPress 5.0+</span>
                  <span className="text-sm text-muted-foreground">PHP 7.4+</span>
                </div>
              </div>
            </div>
            <Button size="lg" onClick={handleDownload} className="gap-2">
              <Download className="h-5 w-5" />
              Scarica Plugin
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="install" className="space-y-6">
        <TabsList>
          <TabsTrigger value="install">Installazione</TabsTrigger>
          <TabsTrigger value="features">Funzionalita</TabsTrigger>
          <TabsTrigger value="api">Documentazione API</TabsTrigger>
        </TabsList>

        {/* Installation Tab */}
        <TabsContent value="install" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guida all&apos;Installazione</CardTitle>
              <CardDescription>
                Segui questi passaggi per collegare il tuo sito WordPress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {installationSteps.map((item, index) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-muted-foreground mt-1">{item.description}</p>
                      {index < installationSteps.length - 1 && (
                        <div className="border-l-2 border-dashed border-muted ml-[-20px] h-6 mt-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Suggerimento:</strong> Dopo aver installato il plugin, puoi testare la connessione
              direttamente dalla pagina impostazioni di WordPress prima di aggiungere il sito alla piattaforma.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pluginFeatures.map((feature) => (
              <Card key={feature.title}>
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dati Raccolti</CardTitle>
              <CardDescription>
                Ecco tutti i dati che il plugin raccoglie e invia alla piattaforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Server className="h-4 w-4" /> Informazioni Server
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Versione PHP e configurazione</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Versione MySQL/MariaDB</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Web server (Apache, Nginx, ecc.)</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Sistema operativo</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Spazio disco e utilizzo</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Estensioni PHP caricate</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileCode className="h-4 w-4" /> Informazioni WordPress
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Versione WordPress</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Plugin installati e versioni</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Temi installati e attivo</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Aggiornamenti disponibili</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Configurazione costanti WP</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Stato Site Health</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Documentation Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint REST API</CardTitle>
              <CardDescription>
                Il plugin espone i seguenti endpoint REST API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Autenticazione</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Tutte le richieste (eccetto /health) richiedono l&apos;API Key nell&apos;header:
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm flex items-center justify-between">
                  <code>X-WM-API-Key: wm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('X-WM-API-Key: your_api_key')}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">GET</Badge>
                    <code className="text-sm">/wp-json/webmaster-monitor/v1/status</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ritorna tutte le informazioni: server + WordPress
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">GET</Badge>
                    <code className="text-sm">/wp-json/webmaster-monitor/v1/server</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ritorna solo informazioni server (PHP, DB, disco)
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">GET</Badge>
                    <code className="text-sm">/wp-json/webmaster-monitor/v1/wordpress</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ritorna solo informazioni WordPress (core, plugin, temi)
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600">GET</Badge>
                    <code className="text-sm">/wp-json/webmaster-monitor/v1/health</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Health check pubblico (no auth) - per uptime monitoring
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">GET</Badge>
                    <code className="text-sm">/wp-json/webmaster-monitor/v1/ping</code>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Test connessione - verifica che l&apos;API Key sia valida
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Esempio Risposta</CardTitle>
              <CardDescription>
                Esempio di risposta dall&apos;endpoint /status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
{`{
  "plugin_version": "1.0.0",
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
