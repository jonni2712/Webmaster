<p align="center">
  <img src="public/logo.svg" alt="Webmaster Monitor" width="150" height="150">
</p>

<h1 align="center">🌐 Webmaster Monitor</h1>

<p align="center">
  <strong>La piattaforma open source definitiva per monitorare e gestire tutti i tuoi siti web</strong>
</p>

<p align="center">
  <a href="#-funzionalità">Funzionalità</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installazione">Installazione</a> •
  <a href="#-self-hosting">Self-Hosting</a> •
  <a href="#-database">Database</a> •
  <a href="#-api">API</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/next.js-15-black" alt="Next.js">
  <img src="https://img.shields.io/badge/typescript-5.x-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/tailwind-4.x-38bdf8" alt="Tailwind">
  <img src="https://img.shields.io/badge/supabase-PostgreSQL-3ecf8e" alt="Supabase">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/🤖_Vibe_Coding-Built_with_Claude-blueviolet?style=for-the-badge" alt="Vibe Coding">
</p>

---

## 🎨 Cos'è il Vibe Coding?

> **Questo progetto è stato creato al 100% con Vibe Coding** 🚀

Il **Vibe Coding** è un nuovo paradigma di sviluppo software dove descrivi quello che vuoi costruire in linguaggio naturale e un'AI (in questo caso **Claude di Anthropic**) scrive il codice per te.

```
Tu: "Voglio una piattaforma per monitorare 800 domini con gestione brand e redirect"
Claude: *scrive migliaia di righe di codice production-ready*
```

### Come è stato costruito questo progetto

1. **Conversazione naturale**: Ho descritto le funzionalità che volevo
2. **Iterazione rapida**: Claude ha scritto codice, io ho testato, abbiamo iterato
3. **Zero boilerplate manuale**: Dalle migration SQL ai componenti React, tutto generato
4. **Best practices automatiche**: TypeScript strict, RLS policies, accessibilità

**Tempo totale di sviluppo**: ~40 ore di conversazione con Claude
**Linee di codice generate**: ~50.000+
**Bug introdotti manualmente**: 0 (tutti i bug sono stati fixati da Claude stesso 😄)

---

## ✨ Funzionalità

### 📊 Dashboard Centrale
- Overview di tutti i siti monitorati
- Statistiche aggregate in tempo reale
- Grafici di uptime e performance
- Alert attivi e cronologia

### 🔍 Monitoraggio Uptime
- Controllo disponibilità ogni 1/5/15 minuti
- Tracciamento tempo di risposta
- Storico uptime con percentuali
- Rilevamento automatico downtime

### 🔒 Monitoraggio SSL
- Verifica validità certificati
- Avvisi scadenza (30/14/7 giorni)
- Dettagli certificato (issuer, date, chain)
- Supporto Let's Encrypt e certificati custom

### ⚡ Performance & Core Web Vitals
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **TTFB** (Time to First Byte)
- Integrazione Google PageSpeed API

### 🌐 Gestione Domini (Portfolio 800+)
- **Vista Tabella**: Lista compatta con filtri avanzati
- **Filtri**: Server, Brand, Stato lifecycle, Relazione
- **HTTP Status Check**: Rileva automaticamente:
  - Redirect e destinazione finale
  - Catene di redirect (301 → 302 → finale)
  - Pagine parking (registrar, hosting default)
  - Errori DNS, SSL, timeout
- **Bulk operations**: Modifica multipla, verifica batch

### 🏢 Brand & Zone (5 Visualizzazioni)
Organizza i domini per brand/progetto con 5 diverse viste:

| Vista | Descrizione |
|-------|-------------|
| **Cards** | Griglia di card con domini raggruppati per tipo |
| **Tabella** | Lista compatta ordinabile e filtrabile |
| **Albero** | Struttura gerarchica espandibile Brand → Domini |
| **Grafo** | Visualizzazione nodi con relazioni |
| **Redirect** | Mappa dedicata origine → destinazione |

### 🔗 Relazioni tra Domini
- **Principale**: Dominio principale del brand (multipli supportati)
- **Redirect**: Punta a un altro dominio
- **Weglot Language**: Variante lingua (es. domain.com/fr/)
- **WordPress Subsite**: Sito nel network multisite
- **Alias**: Dominio alias/mirror
- **Standalone**: Dominio indipendente

### 🖥️ Gestione Server
- Catalogo server con provider e hostname
- Assegnazione domini a server
- Statistiche siti per server
- Stati: attivo, in manutenzione, dismissione

### 📦 Aggiornamenti CMS
- **WordPress**: Core, plugin, temi con versioni
- **PrestaShop**: Moduli e core updates
- Notifiche aggiornamenti critici di sicurezza

### 🛒 E-commerce Monitoring
- Tracciamento transazioni
- Revenue e ordini giornalieri
- Alert su calo vendite anomalo

### 🚨 Sistema Alert Completo
- **Canali**: Email, Slack, Telegram, Discord, Webhook
- **Regole personalizzabili**: Soglie, cooldown, escalation
- **Acknowledge**: Gestione alert con note
- **Storico**: Log completo con filtri

### 👥 Multi-Tenant & Team
- Workspace separati per clienti/progetti
- **Ruoli**:
  - `owner`: Controllo completo
  - `admin`: Gestione siti e membri
  - `member`: Operazioni base
  - `viewer`: Solo lettura
- Inviti via email con scadenza

### 🔐 Autenticazione
- Email/Password con verifica email
- OAuth: GitHub, Google
- Password reset sicuro
- Sessioni JWT con refresh

---

## 🛠 Tech Stack

### Frontend
| Tecnologia | Versione | Uso |
|------------|----------|-----|
| **Next.js** | 15.x | Framework React con App Router |
| **React** | 19.x | UI Library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Styling utility-first |
| **Radix UI** | latest | Primitive components accessibili |
| **shadcn/ui** | latest | Component library |
| **Lucide** | latest | Icone |
| **Recharts** | latest | Grafici |
| **React Hook Form** | latest | Form management |
| **Zod** | latest | Schema validation |

### Backend
| Tecnologia | Versione | Uso |
|------------|----------|-----|
| **Next.js API Routes** | 15.x | REST API |
| **NextAuth.js** | 5.x | Autenticazione |
| **Supabase** | latest | Database + Auth + Realtime |
| **PostgreSQL** | 15.x | Database relazionale |
| **Resend** | latest | Transactional email |

### Infrastructure
| Tecnologia | Uso |
|------------|-----|
| **Vercel** | Hosting cloud (opzionale) |
| **Docker** | Self-hosting containerizzato |
| **Traefik** | Reverse proxy con SSL auto |

### Development
| Tool | Uso |
|------|-----|
| **ESLint** | Linting |
| **Prettier** | Formatting |
| **TypeScript** | Type checking |
| **Supabase CLI** | Database migrations |

---

## 📦 Installazione

### Prerequisiti

- **Node.js** 18.x o superiore
- **npm** 9.x o superiore
- **Account Supabase** (gratuito su [supabase.com](https://supabase.com))

### 1. Clone del Repository

```bash
git clone https://github.com/jonni2712/Webmaster.git
cd Webmaster
```

### 2. Installazione Dipendenze

```bash
npm install
```

### 3. Configurazione Ambiente

```bash
# Copia il template
cp .env.example .env.local

# Apri e modifica con i tuoi valori
nano .env.local  # o usa il tuo editor preferito
```

#### Variabili Obbligatorie

```env
# ===================
# SUPABASE
# ===================
# Trova questi valori in: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# ===================
# NEXTAUTH
# ===================
NEXTAUTH_URL=http://localhost:3000
# Genera con: openssl rand -base64 32
NEXTAUTH_SECRET=la-tua-chiave-segreta-di-32-caratteri

# ===================
# EMAIL (Resend)
# ===================
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=Webmaster Monitor <noreply@tuodominio.com>
```

#### Variabili Opzionali

```env
# OAuth Providers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Google PageSpeed API (per Core Web Vitals)
PAGESPEED_API_KEY=

# Cron Jobs
CRON_SECRET=chiave-per-autenticare-cron

# Encryption (per API keys nel DB)
ENCRYPTION_KEY=genera-con-openssl-rand-hex-32
```

### 4. Setup Database

#### Opzione A: Supabase CLI (Consigliata)

```bash
# Installa Supabase CLI
npm install -g supabase

# Login
supabase login

# Linka al tuo progetto
supabase link --project-ref il-tuo-project-ref

# Applica tutte le migration
supabase db push
```

#### Opzione B: SQL Editor Manuale

1. Vai su Supabase Dashboard → SQL Editor
2. Esegui in ordine tutti i file in `supabase/migrations/`

### 5. Avvia il Server di Sviluppo

```bash
npm run dev
```

🎉 Apri [http://localhost:3000](http://localhost:3000)

### 6. Crea il Primo Utente

1. Vai su `/register`
2. Registrati con email e password
3. Verifica l'email (controlla spam)
4. Accedi e crea il tuo primo workspace

---

## 🐳 Self-Hosting con Docker

Per chi vuole hostare Webmaster Monitor sul proprio server.

### Quick Start (5 minuti)

```bash
# 1. Clone
git clone https://github.com/jonni2712/Webmaster.git
cd Webmaster

# 2. Configura
cp .env.example .env
nano .env  # Modifica i valori

# 3. Avvia
docker-compose up -d

# 4. Apri http://localhost:3000
```

### Requisiti Server

| Risorsa | Minimo | Consigliato |
|---------|--------|-------------|
| **CPU** | 1 core | 2+ cores |
| **RAM** | 2 GB | 4 GB |
| **Storage** | 10 GB | 20 GB SSD |
| **OS** | Linux (qualsiasi) | Ubuntu 22.04 |

### Architettura Docker

```
┌─────────────────────────────────────────────────────────┐
│                     docker-compose                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐  │
│  │             │   │             │   │             │  │
│  │  Traefik    │──▶│    App      │──▶│  PostgreSQL │  │
│  │  (SSL/LB)   │   │  (Next.js)  │   │    (DB)     │  │
│  │             │   │             │   │             │  │
│  └─────────────┘   └─────────────┘   └─────────────┘  │
│       :80/:443         :3000             :5432        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Comandi Utili

```bash
# Visualizza log
docker-compose logs -f app

# Riavvia servizi
docker-compose restart

# Aggiorna a nuova versione
git pull
docker-compose build --no-cache
docker-compose up -d

# Backup database
docker-compose exec db pg_dump -U webmaster webmaster > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T db psql -U webmaster webmaster
```

### Produzione con SSL (Traefik)

```bash
# Configura dominio nel .env
DOMAIN=webmaster.tuodominio.com
LETSENCRYPT_EMAIL=admin@tuodominio.com

# Avvia con profilo production
docker-compose --profile production up -d
```

📖 **[Guida completa Self-Hosting](docs/self-hosting.md)**

---

## 🗄 Database

### Schema ER (Semplificato)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   tenants    │     │    users     │     │ user_tenants │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │◀───┐│ id (PK)      │◀───┐│ user_id (FK) │
│ name         │    ││ email        │    ││ tenant_id(FK)│
│ slug         │    ││ password     │    ││ role         │
│ plan         │    │└──────────────┘    │└──────────────┘
└──────────────┘    │                    │
       │            │                    │
       │            └────────────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    sites     │     │   servers    │     │    brands    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ tenant_id(FK)│     │ tenant_id(FK)│     │ tenant_id(FK)│
│ server_id(FK)│────▶│ name         │     │ name         │
│ brand_id(FK) │────▶│ provider     │     │ description  │
│ url          │     │ hostname     │     └──────────────┘
│ platform     │     └──────────────┘
│ lifecycle    │
│ http_status  │
│ ssl_valid    │
└──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ uptime_checks│     │  ssl_checks  │     │ performance  │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ site_id (FK) │     │ site_id (FK) │     │ site_id (FK) │
│ status       │     │ valid        │     │ lcp          │
│ response_time│     │ expires_at   │     │ fid          │
│ checked_at   │     │ issuer       │     │ cls          │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Tabelle Principali

| Tabella | Descrizione | Righe stimate |
|---------|-------------|---------------|
| `tenants` | Workspace/organizzazioni | ~100 |
| `users` | Utenti registrati | ~500 |
| `user_tenants` | Relazione utenti-tenant | ~600 |
| `sites` | Siti monitorati | ~1000 |
| `servers` | Server fisici/VPS | ~50 |
| `brands` | Brand/progetti | ~100 |
| `clients` | Clienti | ~200 |
| `uptime_checks` | Log controlli uptime | ~1M |
| `ssl_checks` | Log controlli SSL | ~100K |
| `performance_checks` | Metriche CWV | ~500K |
| `alerts` | Avvisi generati | ~10K |
| `alert_channels` | Canali notifica | ~200 |
| `activity_logs` | Log attività | ~100K |

### Migration Files

```
supabase/migrations/
├── 001_initial_schema.sql        # Schema base
├── 002_auth_tables.sql           # Tabelle autenticazione
├── 003_rls_policies.sql          # Row Level Security
├── 004_production_rls.sql        # RLS ottimizzate
├── 005_monitoring_tables.sql     # Uptime, SSL, Performance
├── 006_alerts_system.sql         # Sistema alert
├── 007_activity_logs.sql         # Log attività
├── 008_team_management.sql       # Gestione team
├── 009_clients.sql               # Tabella clienti
├── 010_ecommerce.sql             # Monitoring e-commerce
├── 011_vercel_deploy.sql         # Integrazione Vercel
├── 012_multisite.sql             # WordPress multisite
├── 013_security_fixes.sql        # Fix sicurezza
├── 014_domain_management.sql     # Gestione domini avanzata
├── 015_brands.sql                # Sistema brand
├── 016_alert_cooldown.sql        # Cooldown alert
├── 017_alert_settings.sql        # Impostazioni alert
├── 018_site_fields.sql           # Campi extra siti
├── 019_domain_relations.sql      # Relazioni tra domini
├── 020_domain_http_check.sql     # HTTP status check
├── 021_fix_security_views.sql    # Fix security definer
├── 022_fix_search_path.sql       # Fix function security
└── 023_fix_rls_performance.sql   # Ottimizzazione RLS
```

### Row Level Security (RLS)

Tutte le tabelle sono protette con RLS per garantire isolamento multi-tenant:

```sql
-- Esempio policy per sites
CREATE POLICY "sites_tenant_isolation" ON sites
    FOR ALL USING (
        tenant_id IN (
            SELECT ut.tenant_id FROM user_tenants ut
            WHERE ut.user_id = (SELECT auth.uid())
        )
    );
```

---

## 🔌 API

### Autenticazione

Tutte le API richiedono autenticazione via NextAuth session.

### Endpoints Principali

#### Sites

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/sites` | Lista siti del tenant |
| `POST` | `/api/sites` | Crea nuovo sito |
| `GET` | `/api/sites/[id]` | Dettaglio sito |
| `PUT` | `/api/sites/[id]` | Aggiorna sito |
| `DELETE` | `/api/sites/[id]` | Elimina sito |

#### Portfolio Domini

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/portfolio/domains` | Lista tutti i domini |
| `POST` | `/api/portfolio/domains/check-status` | Verifica HTTP status batch |

#### Brands

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/portfolio/brands` | Lista brand con domini |
| `POST` | `/api/portfolio/brands` | Crea brand |
| `PUT` | `/api/portfolio/brands/[id]` | Aggiorna brand |
| `DELETE` | `/api/portfolio/brands/[id]` | Elimina brand |
| `POST` | `/api/portfolio/brands/set-primary` | Imposta dominio principale |
| `POST` | `/api/portfolio/brands/add-domains` | Aggiungi domini a brand |

#### Servers

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/servers` | Lista server |
| `POST` | `/api/servers` | Crea server |
| `PUT` | `/api/servers/[id]` | Aggiorna server |
| `DELETE` | `/api/servers/[id]` | Elimina server |

#### Monitoring

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/sites/[id]/uptime` | Storico uptime |
| `GET` | `/api/sites/[id]/ssl` | Stato SSL |
| `GET` | `/api/sites/[id]/performance` | Metriche CWV |

#### Cron Jobs

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `POST` | `/api/cron/uptime` | Esegui check uptime |
| `POST` | `/api/cron/ssl` | Esegui check SSL |
| `POST` | `/api/cron/performance` | Esegui check CWV |

---

## 📁 Struttura Progetto

```
webmaster-monitor/
│
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── 📁 (auth)/             # Pagine autenticazione
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── verify-email/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   │
│   │   ├── 📁 (dashboard)/        # Pagine protette
│   │   │   ├── dashboard/
│   │   │   ├── sites/
│   │   │   ├── portfolio/
│   │   │   │   ├── domains/       # Gestione domini
│   │   │   │   ├── zones/         # Brand & Zone
│   │   │   │   ├── servers/       # Gestione server
│   │   │   │   └── import/        # Import CSV
│   │   │   ├── alerts/
│   │   │   ├── team/
│   │   │   └── settings/
│   │   │
│   │   └── 📁 api/                # API Routes
│   │       ├── auth/
│   │       ├── sites/
│   │       ├── portfolio/
│   │       ├── servers/
│   │       ├── alerts/
│   │       └── cron/
│   │
│   ├── 📁 components/
│   │   ├── 📁 ui/                 # shadcn/ui components
│   │   ├── 📁 dashboard/          # Dashboard components
│   │   ├── 📁 sites/              # Site management
│   │   ├── 📁 portfolio/          # Portfolio components
│   │   └── 📁 layout/             # Layout components
│   │
│   ├── 📁 lib/
│   │   ├── 📁 auth/               # NextAuth config
│   │   ├── 📁 supabase/           # Supabase clients
│   │   ├── 📁 email/              # Email templates
│   │   ├── 📁 monitoring/         # Check logic
│   │   ├── 📁 constants/          # App constants
│   │   └── 📁 validations/        # Zod schemas
│   │
│   └── 📁 types/                  # TypeScript definitions
│
├── 📁 supabase/
│   └── 📁 migrations/             # SQL migrations
│
├── 📁 public/                     # Static assets
│
├── 📁 docs/                       # Documentation
│   └── self-hosting.md
│
├── 📄 Dockerfile                  # Docker build
├── 📄 docker-compose.yml          # Docker stack
├── 📄 .env.example                # Environment template
├── 📄 next.config.ts              # Next.js config
├── 📄 tailwind.config.ts          # Tailwind config
├── 📄 tsconfig.json               # TypeScript config
├── 📄 package.json                # Dependencies
├── 📄 LICENSE                     # AGPL-3.0
├── 📄 CONTRIBUTING.md             # Contribution guide
└── 📄 README.md                   # This file
```

---

## ☁️ Cloud vs Self-Hosted

| Feature | Self-Hosted | Cloud Free | Cloud Pro |
|---------|:-----------:|:----------:|:---------:|
| Prezzo | **Gratis** | **Gratis** | €19/mese |
| Siti monitorati | Illimitati | 5 | Illimitati |
| Check interval | Custom | 15 min | 1 min |
| Team members | Illimitati | 1 | Illimitati |
| Data retention | Illimitato | 7 giorni | 1 anno |
| Supporto | Community | Email | Prioritario |
| Backup | Manuale | ❌ | Automatici |
| SSL automatico | DIY | ✅ | ✅ |
| Custom domain | ✅ | ❌ | ✅ |

---

## 🤝 Contributing

I contributi sono i benvenuti! Questo progetto è nato con vibe coding e continua a crescere con l'aiuto della community.

### Come Contribuire

1. **Fork** il repository
2. **Crea branch**: `git checkout -b feature/nuova-feature`
3. **Sviluppa** seguendo le convenzioni
4. **Testa**: `npm run lint && npm run type-check`
5. **Commit**: `git commit -m "feat: descrizione"`
6. **Push**: `git push origin feature/nuova-feature`
7. **Pull Request**

📖 **[Guida completa Contributing](CONTRIBUTING.md)**

### Idee per Contributi

- 🌍 Traduzioni (i18n)
- 📊 Nuovi tipi di monitoring
- 🔌 Integrazioni (Cloudflare, AWS, etc.)
- 📱 App mobile
- 🎨 Temi UI
- 📖 Documentazione

---

## 📜 License

Webmaster Monitor è distribuito con licenza **[AGPL-3.0](LICENSE)**.

```
✅ Uso commerciale
✅ Modifica
✅ Distribuzione
✅ Uso privato

📝 Deve mantenere stessa licenza
📝 Deve rendere disponibile il codice sorgente
📝 Deve indicare le modifiche
```

---

## 🙏 Credits

- **[Claude](https://claude.ai)** - L'AI che ha scritto il 100% del codice
- **[Anthropic](https://anthropic.com)** - Creatori di Claude
- **[Vercel](https://vercel.com)** - Hosting e Next.js
- **[Supabase](https://supabase.com)** - Database e Auth
- **[shadcn/ui](https://ui.shadcn.com)** - Componenti UI
- **[Tailwind CSS](https://tailwindcss.com)** - Styling

---

## 📬 Contatti

- **GitHub Issues**: [Bug reports & Feature requests](https://github.com/jonni2712/Webmaster/issues)
- **GitHub Discussions**: [Domande & Community](https://github.com/jonni2712/Webmaster/discussions)
- **Twitter**: [@webmastermon](https://twitter.com/webmastermon)
- **Email**: info@webmaster-monitor.com

---

<p align="center">
  <strong>Made with 🤖 Vibe Coding + ❤️ by <a href="https://github.com/jonni2712">Jonathan Boccotti</a></strong>
</p>

<p align="center">
  <sub>Se ti piace questo progetto, lascia una ⭐ su GitHub!</sub>
</p>
