<p align="center">
  <img src="public/logo.svg" alt="Webmaster Monitor" width="120" height="120">
</p>

<h1 align="center">Webmaster Monitor</h1>

<p align="center">
  <strong>Piattaforma open source per monitorare e gestire tutti i tuoi siti web</strong>
</p>

<p align="center">
  <a href="#funzionalità">Funzionalità</a> •
  <a href="#demo">Demo</a> •
  <a href="#self-hosting">Self-Hosting</a> •
  <a href="#cloud">Cloud</a> •
  <a href="#documentazione">Docs</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/next.js-16-black" alt="Next.js">
  <img src="https://img.shields.io/badge/typescript-5-blue" alt="TypeScript">
</p>

---

## Funzionalità

- **Monitoraggio Uptime** - Controllo disponibilità siti in tempo reale
- **Monitoraggio SSL** - Verifica certificati e avvisi scadenza
- **Performance Check** - Metriche Core Web Vitals (LCP, FID, CLS)
- **Gestione Domini** - Portfolio 800+ domini con stati, redirect, scadenze
- **Brand & Zone** - Organizza domini per brand con 5 visualizzazioni
- **HTTP Status Check** - Rileva automaticamente redirect, parking, errori
- **Aggiornamenti CMS** - Tracciamento update WordPress e PrestaShop
- **E-commerce** - Monitoraggio transazioni e vendite
- **Sistema Alert** - Notifiche via email, Slack, Telegram, Discord
- **Multi-tenant** - Supporto team con ruoli (owner, admin, member, viewer)

## Demo

🌐 **[Prova la demo live](https://webmaster-monitor.vercel.app)**

## Self-Hosting

Puoi installare Webmaster Monitor sul tuo server in 5 minuti:

```bash
# Clona
git clone https://github.com/jonni2712/Webmaster.git
cd Webmaster

# Configura
cp .env.example .env
# Modifica .env con i tuoi valori

# Avvia
docker-compose up -d

# Apri http://localhost:3000
```

📖 **[Guida completa Self-Hosting](docs/self-hosting.md)**

### Requisiti

- Docker 20.10+ e Docker Compose 2.0+
- 2GB RAM (4GB consigliati)
- Supabase account (gratuito) o self-hosted

## Cloud (Hosted)

Non vuoi gestire server? Usa la versione hosted:

🚀 **[webmaster-monitor.com](https://webmaster-monitor.com)** - Inizia gratis

| Feature | Self-Hosted | Cloud Free | Cloud Pro |
|---------|:-----------:|:----------:|:---------:|
| Siti illimitati | ✅ | 5 siti | ✅ |
| Tutti i monitoraggi | ✅ | ✅ | ✅ |
| Team members | ✅ | 1 | Illimitati |
| Supporto | Community | Email | Prioritario |
| Backup automatici | Manuale | ❌ | ✅ |
| Prezzo | Gratis | Gratis | €19/mese |

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **UI**: Radix UI, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js
- **Email**: Resend
- **Deploy**: Vercel / Docker

## Setup Sviluppo

```bash
# Installa dipendenze
npm install

# Configura ambiente
cp .env.example .env.local

# Avvia dev server
npm run dev
```

## Struttura Progetto

```
src/
├── app/
│   ├── (auth)/           # Login, register, reset password
│   ├── (dashboard)/      # Dashboard, sites, portfolio
│   └── api/              # API Routes
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   └── portfolio/        # Domain management
├── lib/
│   ├── auth/             # NextAuth config
│   ├── supabase/         # Database client
│   └── monitoring/       # Check logic
└── types/                # TypeScript types
```

## Documentazione

- 📖 [Self-Hosting Guide](docs/self-hosting.md)
- 🔧 [Configuration](docs/configuration.md)
- 🔌 [API Reference](docs/api.md)
- 🤝 [Contributing](CONTRIBUTING.md)

## Contributing

I contributi sono benvenuti! Leggi [CONTRIBUTING.md](CONTRIBUTING.md) per iniziare.

```bash
# Fork e clone
git clone https://github.com/tuouser/webmaster-monitor.git

# Crea branch
git checkout -b feature/mia-feature

# Commit
git commit -m "feat: aggiungi mia feature"

# Push e PR
git push origin feature/mia-feature
```

## Community

- 💬 [GitHub Discussions](https://github.com/jonni2712/Webmaster/discussions)
- 🐛 [Issue Tracker](https://github.com/jonni2712/Webmaster/issues)
- 🐦 [Twitter](https://twitter.com/webmastermon)

## License

Webmaster Monitor è distribuito con licenza [AGPL-3.0](LICENSE).

Questo significa che puoi:
- ✅ Usarlo gratuitamente
- ✅ Modificarlo
- ✅ Distribuirlo
- ✅ Usarlo commercialmente

A condizione che:
- 📝 Mantieni la stessa licenza per lavori derivati
- 📝 Rendi disponibile il codice sorgente delle modifiche

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/jonni2712">Jonathan Boccotti</a>
</p>
