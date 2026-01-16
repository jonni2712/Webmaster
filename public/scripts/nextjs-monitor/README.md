# Webmaster Monitor - Next.js Integration

Questo script permette di monitorare il tuo sito Next.js dalla piattaforma Webmaster Monitor.

## Informazioni raccolte

- **Framework**: versione Next.js e React
- **Node.js**: versione, architettura, piattaforma
- **Dipendenze**: totali, produzione, sviluppo, pacchetti chiave
- **Build**: ambiente, build ID, deployment ID
- **Server**: hostname, uptime, memoria, CPU
- **Performance**: memoria processo, heap usage
- **Health checks**: stato generale e controlli personalizzati

## Installazione

### 1. Copia i file nel tuo progetto

```bash
# Crea la directory per la libreria
mkdir -p lib

# Crea la directory per l'API route
mkdir -p app/api/webmaster-monitor/status
```

Copia i file (rimuovi l'estensione `.txt`):
- `webmaster-monitor.ts.txt` → `lib/webmaster-monitor.ts`
- `route.ts.txt` → `app/api/webmaster-monitor/status/route.ts`

### 2. Configura le variabili d'ambiente

Aggiungi al tuo `.env.local`:

```env
# Webmaster Monitor
WEBMASTER_MONITOR_SITE_ID=il-tuo-site-id
WEBMASTER_MONITOR_API_KEY=la-tua-api-key
WEBMASTER_MONITOR_URL=https://webmaster-monitor.com
```

Puoi trovare `SITE_ID` e generare l'`API_KEY` dalla dashboard di Webmaster Monitor:
1. Vai su Siti → Il tuo sito Next.js → Modifica
2. Copia l'ID del sito dall'URL
3. Genera una nuova API Key

### 3. Verifica l'installazione

Avvia il tuo sito e visita:

```
http://localhost:3000/api/webmaster-monitor/status
```

Dovresti vedere un JSON con tutte le informazioni del sito.

## Configurazione avanzata

### Health checks personalizzati

Puoi aggiungere controlli di salute personalizzati modificando `route.ts`:

```typescript
const customHealthChecks: Record<string, () => Promise<boolean>> = {
  // Verifica connessione database
  database: async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  },

  // Verifica Redis
  redis: async () => {
    try {
      await redis.ping();
      return true;
    } catch {
      return false;
    }
  },

  // Verifica API esterna
  external_api: async () => {
    try {
      const res = await fetch('https://api.example.com/health', {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
```

### Dati personalizzati

Puoi inviare dati personalizzati aggiungendoli alla configurazione:

```typescript
const config = {
  siteId: process.env.WEBMASTER_MONITOR_SITE_ID || '',
  apiKey: process.env.WEBMASTER_MONITOR_API_KEY || '',
  apiUrl: process.env.WEBMASTER_MONITOR_URL,
  customData: {
    app_version: '1.2.3',
    feature_flags: {
      new_checkout: true,
      dark_mode: true,
    },
  },
};
```

### Invio automatico (Cron Job)

Per inviare lo stato automaticamente, puoi usare Vercel Cron o un servizio esterno:

**Vercel Cron** (`vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/webmaster-monitor/status",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Nota**: Per Vercel Cron, devi modificare la route per accettare richieste GET senza autenticazione dal cron di Vercel.

## Sicurezza

- L'endpoint `/api/webmaster-monitor/status` richiede l'header `x-wm-api-key` per l'accesso
- Non esporre mai l'API key nel codice client-side
- Usa sempre HTTPS in produzione

## Troubleshooting

### "Unauthorized" error

Verifica che:
1. `WEBMASTER_MONITOR_API_KEY` sia impostata correttamente
2. L'header `x-wm-api-key` sia inviato con le richieste

### "Failed to collect status"

Controlla i log del server per errori specifici. Potrebbe essere un problema di permessi del filesystem.

### Dati non aggiornati sulla piattaforma

Verifica che:
1. Il sito sia raggiungibile dalla piattaforma
2. L'API key sia valida
3. Il `SITE_ID` corrisponda al sito sulla piattaforma

## Supporto

Per assistenza, contatta il supporto Webmaster Monitor o apri una issue su GitHub.
