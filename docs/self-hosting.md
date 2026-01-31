# Self-Hosting Webmaster Monitor

Questa guida spiega come installare e configurare Webmaster Monitor sul tuo server.

## Requisiti

- **Docker** 20.10+ e **Docker Compose** 2.0+
- **RAM**: minimo 2GB, consigliato 4GB
- **Storage**: minimo 10GB
- **Dominio** (opzionale, per HTTPS)

## Quick Start (5 minuti)

```bash
# 1. Clona il repository
git clone https://github.com/tuouser/webmaster-monitor.git
cd webmaster-monitor

# 2. Copia e configura le variabili d'ambiente
cp .env.example .env

# 3. Modifica .env con i tuoi valori (vedi sezione Configurazione)
nano .env

# 4. Avvia i container
docker-compose up -d

# 5. Apri http://localhost:3000
```

## Configurazione

### Variabili Obbligatorie

```env
# Database
POSTGRES_PASSWORD=una-password-molto-sicura

# Supabase (usa Supabase Cloud o self-hosted)
NEXT_PUBLIC_SUPABASE_URL=https://tuo-progetto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tua-anon-key
SUPABASE_SERVICE_ROLE_KEY=tua-service-role-key

# Auth
NEXTAUTH_SECRET=genera-con-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

### Genera Chiavi Sicure

```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 32

# POSTGRES_PASSWORD
openssl rand -base64 24
```

## Opzioni di Deployment

### 1. Sviluppo Locale

```bash
docker-compose up -d
```

Servizi disponibili:
- **App**: http://localhost:3000
- **Database**: localhost:5432

### 2. Produzione con SSL (Traefik)

```bash
# Abilita il profilo production
docker-compose --profile production up -d
```

Configura nel `.env`:
```env
DOMAIN=webmaster.tuodominio.com
LETSENCRYPT_EMAIL=admin@tuodominio.com
```

### 3. Produzione con nginx (alternativa)

Crea `/etc/nginx/sites-available/webmaster`:

```nginx
server {
    listen 80;
    server_name webmaster.tuodominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name webmaster.tuodominio.com;

    ssl_certificate /etc/letsencrypt/live/webmaster.tuodominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webmaster.tuodominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Genera certificato SSL
sudo certbot --nginx -d webmaster.tuodominio.com
```

## Supabase: Cloud vs Self-Hosted

### Opzione A: Supabase Cloud (Consigliato)

1. Crea account su [supabase.com](https://supabase.com)
2. Crea nuovo progetto
3. Copia le chiavi API da Settings > API
4. Esegui le migration:

```bash
# Installa Supabase CLI
npm install -g supabase

# Login
supabase login

# Linka progetto
supabase link --project-ref tuo-project-id

# Applica migration
supabase db push
```

### Opzione B: Supabase Self-Hosted

Segui la [guida ufficiale](https://supabase.com/docs/guides/self-hosting/docker).

## Aggiornamenti

```bash
# Pull nuova versione
git pull origin main

# Ricostruisci container
docker-compose build --no-cache

# Riavvia
docker-compose up -d

# Applica migration (se necessario)
supabase db push
```

## Backup

### Database

```bash
# Backup
docker-compose exec db pg_dump -U webmaster webmaster > backup.sql

# Restore
cat backup.sql | docker-compose exec -T db psql -U webmaster webmaster
```

### Backup Automatico (cron)

```bash
# Aggiungi a crontab -e
0 2 * * * docker-compose -f /path/to/docker-compose.yml exec -T db pg_dump -U webmaster webmaster | gzip > /backups/webmaster-$(date +\%Y\%m\%d).sql.gz
```

## Monitoraggio

### Logs

```bash
# Tutti i servizi
docker-compose logs -f

# Solo app
docker-compose logs -f app

# Solo database
docker-compose logs -f db
```

### Health Check

```bash
# Status container
docker-compose ps

# Risorse
docker stats
```

## Troubleshooting

### Container non si avvia

```bash
# Verifica logs
docker-compose logs app

# Problemi comuni:
# - POSTGRES_PASSWORD non impostata
# - Porta 3000 già in uso (cambia APP_PORT)
# - Memoria insufficiente
```

### Errore connessione database

```bash
# Verifica che db sia healthy
docker-compose ps

# Test connessione
docker-compose exec db psql -U webmaster -d webmaster -c "SELECT 1"
```

### Migration fallite

```bash
# Esegui manualmente
docker-compose exec db psql -U webmaster -d webmaster -f /docker-entrypoint-initdb.d/001_initial.sql
```

### Reset completo

```bash
# ATTENZIONE: cancella tutti i dati!
docker-compose down -v
docker-compose up -d
```

## Risorse

- [Documentazione Next.js](https://nextjs.org/docs)
- [Documentazione Supabase](https://supabase.com/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## Supporto

- **Issues**: [GitHub Issues](https://github.com/tuouser/webmaster-monitor/issues)
- **Discussioni**: [GitHub Discussions](https://github.com/tuouser/webmaster-monitor/discussions)
- **Email**: support@tuodominio.com
