# Webmaster Monitor

Piattaforma di monitoraggio siti web multi-tenant per webmaster e agenzie digitali.

## Funzionalita

- **Monitoraggio Uptime** - Controllo disponibilita siti in tempo reale
- **Monitoraggio SSL** - Verifica certificati e avvisi scadenza
- **Performance Check** - Metriche Core Web Vitals (LCP, FID, CLS)
- **Aggiornamenti CMS** - Tracciamento update WordPress e PrestaShop
- **E-commerce** - Monitoraggio transazioni e vendite
- **Sistema Alert** - Notifiche via email, Slack, Telegram, Discord, webhook
- **Multi-tenant** - Supporto team con ruoli (owner, admin, member, viewer)
- **Autenticazione** - Login con email/password, GitHub, Google

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **UI Components**: Radix UI, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Autenticazione**: NextAuth.js (OAuth + Email/Password)
- **Email**: Resend
- **Deploy**: Vercel

## Setup Locale

### 1. Clona il repository

```bash
git clone https://github.com/jonni2712/Webmaster.git
cd Webmaster
npm install
```

### 2. Configura variabili ambiente

Crea un file `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera-una-chiave-segreta-32-caratteri

# OAuth (opzionale)
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=Webmaster Monitor <noreply@tuodominio.com>

# Cron Jobs
CRON_SECRET=genera-una-chiave-segreta
```

### 3. Setup Database

Esegui lo script SQL nel Supabase SQL Editor:

```bash
# Il file si trova in:
supabase/deploy_all.sql
```

Questo crea:
- Tabelle per autenticazione email/password
- Funzioni helper RLS
- Policy di sicurezza Row Level Security

### 4. Avvia il server

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Struttura Progetto

```
src/
├── app/
│   ├── (auth)/          # Pagine autenticazione
│   │   ├── login/
│   │   ├── register/
│   │   ├── verify-email/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/     # Pagine protette
│   │   ├── dashboard/
│   │   └── sites/
│   └── api/             # API Routes
│       ├── auth/
│       ├── sites/
│       └── cron/
├── components/
│   ├── ui/              # Componenti shadcn/ui
│   ├── dashboard/
│   └── layout/
├── lib/
│   ├── auth/            # Configurazione NextAuth
│   ├── supabase/        # Client Supabase
│   ├── email/           # Template email
│   ├── monitoring/      # Logica monitoraggio
│   └── validations/     # Schemi Zod
└── types/               # TypeScript definitions
```

## Database Schema

### Tabelle Principali

| Tabella | Descrizione |
|---------|-------------|
| `tenants` | Workspace/organizzazioni |
| `users` | Utenti registrati |
| `user_tenants` | Relazione utenti-tenant con ruoli |
| `sites` | Siti monitorati |
| `uptime_checks` | Log controlli uptime |
| `ssl_checks` | Log controlli SSL |
| `performance_checks` | Metriche performance |
| `alerts` | Avvisi generati |
| `alert_channels` | Canali notifica |
| `alert_rules` | Regole alert |

### Ruoli Utente

| Ruolo | Permessi |
|-------|----------|
| `owner` | Controllo completo, puo eliminare |
| `admin` | Gestione siti, alert, membri |
| `member` | Visualizzazione, acknowledge alert |
| `viewer` | Solo visualizzazione |

## Deploy su Vercel

1. Importa il repository su Vercel
2. Configura le variabili ambiente
3. Deploy!

Le API cron (`/api/cron/uptime`, `/api/cron/ssl`) possono essere configurate con Vercel Cron Jobs.

## Licenza

Progetto privato - Tutti i diritti riservati
