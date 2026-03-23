# Design: Modulo Agente cPanel/Plesk per Webmaster Monitor

**Data**: 2026-03-23
**Stato**: Approvato
**Approccio**: Agente Modulare PHP (push model)

---

## Obiettivo

Creare un agente PHP modulare che si installa sui server con cPanel (e in futuro Plesk), raccoglie dati completi sull'infrastruttura (siti, domini, CMS, DNS, SSL, risorse, email, database, backup, errori) e li sincronizza con la piattaforma Webmaster Monitor. I siti rilevati vengono auto-matchati con quelli esistenti o proposti per l'importazione.

## Decisioni chiave

| Decisione | Scelta |
|-----------|--------|
| Modello di connessione | Push — agente sul server (come WP plugin) |
| Priorità pannelli | cPanel prima, Plesk dopo |
| Dati da raccogliere | Tutte e 10 le categorie |
| Sincronizzazione | Ibrida — sync completa ogni 6h + diff/eventi ogni 15min |
| Installazione | Script one-liner (v1), poi WHM Plugin (futuro) |
| Matching siti | Auto-match per dominio + proposta import nuovi |
| Posizione UI | Portfolio > Server (tab cPanel integrata) |

## Architettura Agente

### Struttura file

```
server-agent/
├── agent.php                      # Entry point (cron)
├── config.php                     # API key, platform URL, moduli attivi
├── core/
│   ├── Orchestrator.php           # Carica moduli, coordina sync
│   ├── HttpClient.php             # Invio dati alla piattaforma
│   ├── EventQueue.php             # Coda eventi push immediati
│   └── Logger.php                 # Log locale per debug
├── adapters/
│   ├── PanelAdapterInterface.php  # Contratto comune
│   ├── CpanelAdapter.php          # UAPI / WHM API
│   └── PleskAdapter.php           # (futuro) Plesk XML API
├── modules/
│   ├── AccountsModule.php         # Account, domini, addon, subdomini, parcheggiati
│   ├── DnsModule.php              # Zone DNS, record, verifica puntamento
│   ├── CmsDetectorModule.php      # Scan document root per CMS
│   ├── SslModule.php              # Certificati, scadenze, AutoSSL
│   ├── ResourcesModule.php        # CPU, RAM, disco, bandwidth
│   ├── EmailModule.php            # Caselle, quota, forwarder
│   ├── DatabaseModule.php         # DB MySQL/PG, dimensioni, utenti
│   ├── PhpModule.php              # Versione PHP, estensioni per account
│   ├── BackupModule.php           # Stato backup, ultimo backup
│   └── ErrorsModule.php           # Log errori Apache/PHP, 5xx
├── events/
│   ├── EventDetector.php          # Confronta stato attuale vs precedente
│   └── events_cache.json          # Snapshot ultimo stato (per diff)
└── install.sh                     # One-liner installer
```

### Flusso di esecuzione

```
Cron (ogni 15min)
    → agent.php
        → Orchestrator carica config
        → Per ogni modulo attivo:
            → Modulo chiama CpanelAdapter per i dati raw
            → Modulo normalizza i dati in formato standard
        → EventDetector confronta con snapshot precedente
            → Differenze importanti → push immediato
        → Ogni 6h → sync completa (tutti i dati)
        → Ogni 15min → solo diff + eventi critici
        → HttpClient invia payload alla piattaforma
        → Salva snapshot per prossimo confronto
```

### CMS Detection

Per ogni account cPanel, legge la document root e cerca file identificativi:

- `wp-config.php` → WordPress (versione da `wp-includes/version.php`)
- `config/settings.inc.php` → PrestaShop
- `configuration.php` → Joomla
- `sites/default/settings.php` → Drupal
- `artisan` → Laravel
- `.next/` → Next.js
- `composer.json` → analisi dipendenze per framework PHP

### Formato payload (sync completa)

```json
{
  "agent_version": "1.0.0",
  "panel_type": "cpanel",
  "server_hostname": "srv1.example.com",
  "sync_type": "full",
  "timestamp": "2026-03-23T10:00:00Z",
  "accounts": [
    {
      "username": "exampleu",
      "main_domain": "example.com",
      "addon_domains": ["shop.example.com"],
      "subdomains": ["blog.example.com"],
      "parked_domains": ["example.org"],
      "document_roots": {
        "example.com": "/home/exampleu/public_html",
        "shop.example.com": "/home/exampleu/shop"
      },
      "cms": {
        "example.com": { "type": "wordpress", "version": "6.7.1" },
        "shop.example.com": { "type": "prestashop", "version": "8.1.0" }
      },
      "php_version": "8.3",
      "databases": [
        { "name": "exampleu_wp", "size_mb": 245, "engine": "mysql" }
      ],
      "emails": [
        { "account": "info@example.com", "quota_mb": 500, "used_mb": 120 }
      ],
      "disk_used_mb": 3200,
      "disk_limit_mb": 10000,
      "bandwidth_used_mb": 15000,
      "ssl": {
        "example.com": {
          "issuer": "Let's Encrypt",
          "expires": "2026-06-21",
          "auto_ssl": true
        }
      },
      "backup": {
        "last_backup": "2026-03-22T02:00:00Z",
        "size_mb": 2800,
        "type": "full"
      }
    }
  ],
  "dns_zones": [
    {
      "domain": "example.com",
      "records": [
        { "type": "A", "name": "@", "value": "185.10.20.30" },
        { "type": "MX", "name": "@", "value": "mail.example.com", "priority": 10 },
        { "type": "CNAME", "name": "www", "value": "example.com" }
      ],
      "points_to_this_server": true
    }
  ],
  "server_resources": {
    "cpu_cores": 8,
    "cpu_usage_percent": 45,
    "ram_total_mb": 16384,
    "ram_used_mb": 12000,
    "disk_total_gb": 500,
    "disk_used_gb": 320
  },
  "errors": [
    {
      "domain": "example.com",
      "type": "php_error",
      "message": "Fatal error: Allowed memory size exhausted",
      "timestamp": "2026-03-23T09:45:00Z",
      "file": "/home/exampleu/public_html/wp-includes/plugin.php",
      "count": 15
    }
  ]
}
```

## API Platform Side (Next.js)

### Nuovi endpoint

```
POST /api/agent/sync              # Riceve sync completa o diff
POST /api/agent/event             # Riceve eventi push immediati
POST /api/agent/register          # Prima registrazione agente
GET  /api/agent/config/[serverId] # Agente scarica configurazione
POST /api/agent/heartbeat         # Heartbeat ogni 5min
```

### Autenticazione

Stesso pattern del plugin WordPress — API Key per server:

1. L'utente aggiunge un server in Portfolio > Server con tipo "cPanel"
2. La piattaforma genera un Agent Token (UUID + HMAC)
3. L'utente copia il one-liner con il token incluso
4. Ogni richiesta: `Authorization: Bearer <agent_token>`
5. Backend valida token → identifica server + tenant

### Logica di processing

```
Ricezione sync payload
    → Valida agent token → identifica server + tenant
    → Per ogni account/dominio:
        → AUTO-MATCH: cerca in sites/portfolio_sites
            → Match esatto → arricchisci dati esistenti
            → No match → aggiungi a pending_imports
    → Salva snapshot in tabelle dedicate
    → Confronta con precedente → genera alert:
        - Nuovo errore 5xx
        - SSL in scadenza
        - Disco > 90%
        - Sito rimosso dal server
    → Aggiorna server.last_sync_at, agent_status = "online"
```

### Pending imports

Siti trovati dall'agente ma non presenti nella piattaforma vengono proposti all'utente con opzioni: Importa, Ignora, Importa tutti.

## Database Schema

### Estensione tabella servers

```sql
ALTER TABLE servers ADD COLUMN panel_type TEXT;
ALTER TABLE servers ADD COLUMN agent_token TEXT;
ALTER TABLE servers ADD COLUMN agent_status TEXT DEFAULT 'not_installed';
ALTER TABLE servers ADD COLUMN agent_version TEXT;
ALTER TABLE servers ADD COLUMN last_sync_at TIMESTAMPTZ;
ALTER TABLE servers ADD COLUMN last_heartbeat_at TIMESTAMPTZ;
ALTER TABLE servers ADD COLUMN sync_config JSONB DEFAULT '{}';
```

### Nuove tabelle

- **server_accounts** — Account cPanel con domini, disk usage, bandwidth
- **server_cms_detections** — CMS rilevati per dominio, con `matched_site_id` per auto-match
- **server_dns_zones** — Zone DNS con record e flag `points_to_server`
- **server_emails** — Caselle email, quota, forwarder
- **server_databases** — Database MySQL/PG con dimensioni
- **server_ssl_certs** — Certificati SSL dal pannello
- **server_resource_snapshots** — Time-series risorse server (con retention policy)
- **server_errors** — Errori aggregati con conteggio occorrenze
- **server_backups** — Stato backup dal pannello
- **pending_site_imports** — Siti in attesa di import/ignore

Tutte con RLS per tenant isolation (stesso pattern esistente).

## UI — Portfolio > Server

### Tab per server con agente

- **Overview** — KPI cards (account, domini, SSL warning, CPU/RAM) + grafico risorse 24h + ultimi eventi + banner pending imports
- **Account** — Tabella espandibile: username, dominio principale, CMS, PHP, disco, status + sotto-righe per addon/subdomini
- **DNS** — Verifica puntamento: dominio, dove punta, IP risolto, stato (corretto/cloudflare/non punta qui/parcheggiato)
- **SSL** — Certificati con scadenza, issuer, AutoSSL status
- **Risorse** — Grafici Recharts CPU/RAM/Disco nel tempo
- **Email** — Caselle per account con quota
- **Errori** — Log aggregati: dominio, tipo, messaggio, count, ultimo

### Setup flow

1. Utente seleziona panel_type = "cPanel" sul server
2. Piattaforma mostra one-liner con token incluso
3. Pagina in polling per primo heartbeat
4. Conferma connessione + prima sync automatica

## Fasi di rilascio

| Fase | Moduli | UI | Obiettivo |
|------|--------|-----|-----------|
| **v1 Core** | Accounts, CMS, DNS, SSL | Overview + Account + DNS tabs, setup flow, auto-match + import | Vedi cosa c'è sui server |
| **v2 Monitoring** | Resources, Errors, Backup | Risorse (grafici), Errori, Backup status | Server health |
| **v3 Complete** | Email, Database, PHP | Tab dedicate, filtri, export | Vista completa infrastruttura |

## Error Handling

### Agente

- API cPanel non raggiungibile → retry 3x backoff, skip modulo
- Piattaforma non raggiungibile → salva payload in `/tmp/wm_queue/`, reinvia al prossimo cron (cap 50 file)
- Token invalido → log errore, stop invio
- Modulo singolo fallisce → altri continuano, errore nel payload
- Permessi insufficienti → degradazione graziosa, raccoglie solo dati accessibili
- Timeout scan CMS → skip dopo 30s, segnala

### Piattaforma

- Payload malformato → HTTP 400 con dettaglio
- Token sconosciuto → HTTP 401
- Agente offline > 15min → status "offline", alert opzionale
- Sync parziale → accetta dati disponibili, non sovrascrivere precedenti
- Match ambiguo → pending con flag "ambiguous"
- Conflitto dati WP plugin vs agente → priorità WP plugin per dati WordPress

## Sicurezza

- Agent token cifrato in DB, mai esposto dopo creazione
- Zod validation su ogni payload
- Rate limiting 60 req/min per agente
- Nessuna password nel payload — solo metadati
- Install script HTTPS only con checksum
- API cPanel in readonly — nessuna modifica
