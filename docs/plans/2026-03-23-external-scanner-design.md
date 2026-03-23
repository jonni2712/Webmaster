# Design: External Scanner per Webmaster Monitor

**Data**: 2026-03-23
**Stato**: Approvato

---

## Obiettivo

Scanner esterno che analizza tutti i siti e domini della piattaforma senza accesso ai server, raccogliendo DNS records, CMS detection, SSL, HTTP status, WHOIS. Funziona con qualsiasi provider (Register.it, Aruba, OVH, ecc.) senza credenziali.

## Decisioni

| Decisione | Scelta |
|-----------|--------|
| Target | Siti monitorati + Domini portfolio |
| Frequenza | DNS/SSL ogni 6h, CMS/WHOIS ogni 24h |
| CMS detection | Profondo: headers + path probing + HTML analysis |
| UI | Inline badges + dettaglio espandibile |

## Architettura

Due cron job:
- `/api/cron/scan-dns-ssl` (ogni 6h): DNS resolve, SSL check, HTTP status
- `/api/cron/scan-cms-whois` (ogni 24h): CMS detection, WHOIS lookup

### CMS Detection Pipeline

1. HTTP GET homepage → headers (X-Powered-By, X-Generator) + meta generator
2. Path probing: `/wp-login.php`, `/administrator/`, `/admin/login`, `/_next/`, ecc.
3. HTML analysis: pattern nei path CSS/JS, CDN patterns, versione dagli asset

### DNS Analysis

Per ogni dominio: A, MX, TXT, NS, CNAME records. Derivazioni automatiche:
- NS → provider DNS (Cloudflare, Register.it, Aruba)
- MX → provider email (Google Workspace, Microsoft 365, custom)
- TXT → SPF/DMARC configurato o meno

## Database

Tabella `external_scan_results` con:
- Collegamento flessibile: `site_id` O `portfolio_site_id`
- DNS: A, MX, NS, TXT records + provider derivato
- SSL: issuer, scadenza, protocollo
- HTTP: status, redirect chain, response time
- CMS: tipo, versione, confidence, metodo detection, extras (plugin rilevati)
- WHOIS: registrar, scadenza, nameservers
- Timestamp separati per tipo di scan

## UI

Badge inline su ogni sito/dominio:
- Stato HTTP + response time
- CMS + versione
- DNS provider + IP
- Email provider
- SPF/DMARC status
- SSL status

Vista espandibile con dettagli completi (DNS records, redirect chain, WHOIS, metodo detection).
