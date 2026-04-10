# Professional Redesign — Design Document

**Data**: 2026-04-10
**Approccio**: B — Redesign Full Landing + Design System
**Obiettivo**: Trasformare il sito da "template AI" a prodotto professionale competitivo

---

## Decisioni di Design

| Aspetto | Scelta |
|---------|--------|
| Stile | Moderno/Dinamico (Vercel, Linear) |
| Palette accento | Verde smeraldo / Teal |
| Hero | Animazione astratta (grafico uptime, pulse) |
| Tema landing | Dark mode forzato |
| Tema dashboard | Light mode di default (toggle disponibile) |
| Animazioni | CSS native + IntersectionObserver, zero librerie esterne |

---

## 1. Design System — Palette e Tipografia

### Palette Colori

**Landing Page (Dark Mode Forzato):**
- Background: `#0A0A0A` (nero profondo) con texture noise sottile
- Surface: `#141414` (carte, sezioni alternate)
- Border: `rgba(255,255,255,0.08)`
- Testo primario: `#FAFAFA`
- Testo secondario: `#A1A1AA` (zinc-400)

**Accento — Gradient Teal/Smeraldo:**
- Primary: `#10B981` (emerald-500)
- Primary Light: `#34D399` (emerald-400)
- Gradient hero: `linear-gradient(135deg, #10B981, #0EA5E9)` (emerald → sky)
- Glow effect: `0 0 80px rgba(16, 185, 129, 0.15)`

**Status Colors (semantici):**
- Online/Success: `#10B981` (emerald)
- Warning: `#F59E0B` (amber)
- Error/Down: `#EF4444` (red)
- Info: `#0EA5E9` (sky)

**Dashboard (Light Mode):**
- Background: `#FAFAFA`
- Surface/Card: `#FFFFFF`
- Sidebar: `#F4F4F5` (zinc-100)
- Stesso accento emerald con luminosita' adattata

### Tipografia

- Display/Hero: `Inter` weight 700-800, letter-spacing `-0.025em`
- Headings: `Inter` weight 600
- Body: `Inter` weight 400, line-height 1.6
- Mono/Dati: `Geist Mono` per numeri, stats, codice

**Scala tipografica:**
- display: 56px / 64px
- h1: 36px / 40px
- h2: 28px / 32px
- h3: 20px / 24px
- body: 16px / 24px
- small: 14px / 20px
- caption: 12px / 16px

---

## 2. Landing Page — Struttura

### Navbar (sticky, glassmorphism)
- Sfondo `rgba(10,10,10,0.8)` + `backdrop-blur-xl`
- Logo custom emerald a sinistra
- Nav links al centro con hover underline emerald animato
- CTA "Inizia Gratis" a destra con bordo emerald glow
- Mobile: hamburger con sheet animato

### Hero Section
- Layout: testo a sinistra, animazione a destra (desktop). Centrato mobile.
- Headline: due righe, seconda con gradient text emerald→sky
- Subheadline: grigio zinc, max 60 char/riga
- CTA: "Inizia Gratis" (filled emerald glow) + "Guarda come funziona" (ghost)
- Animazione: SVG con grafico uptime che si disegna, ping dots pulsanti, numeri response time
- Sfondo: dot grid che sfuma verso il basso

### Social Proof Bar
- Testo: "Usato da 500+ webmaster e agenzie in Italia"
- Contatore animato

### Features — "Come funziona"
- 3 blocchi alternati (testo sx/visual dx, invertito)
- Tag badge colorata + titolo h2 + descrizione concreta
- Visual: mockup stilizzato del componente UI
- Animazione: fade-in + slide-up al scroll con stagger 100ms

### Stats Section
- Sfondo surface `#141414`
- 4 metriche in `Geist Mono` con counter animation
- Icone con glow del colore relativo

### Pricing Section
- 3 card, Pro con bordo gradient emerald→sky
- Badge "Piu' Popolare" gradient
- Prezzi in `Geist Mono`
- Checkmark emerald / grigio per feature

### CTA Finale
- Sfondo gradient emerald→sky con overlay pattern
- Headline grande bianca
- Bottone CTA bianco + "Nessuna carta di credito richiesta"

### Footer
- 4 colonne su `#0A0A0A`
- Social icons con hover emerald
- "Made in Italy" badge

---

## 3. Dashboard — Miglioramenti Design System

### Sidebar
- Sfondo zinc-50, bordo destro sottile
- Nav items con barra emerald attiva a sinistra
- Icone zinc-400 → emerald-500 quando attive

### Cards
- Bordi zinc-200, shadow-md
- Hover: shadow-lg + translateY(-1px)
- Border-radius: rounded-xl coerente

### Status Indicators (unificati)
- Online: pallino emerald con pulse animation
- Offline: pallino red statico
- Checking: pallino amber con fade
- Definiti come CSS custom properties

### Grafici (Recharts)
- Palette: emerald, sky, amber, violet, rose
- Tooltip sfondo dark con bordo emerald
- Area charts con gradient fill emerald → trasparente

### Tabelle
- Header zinc-50, testo zinc-500 uppercase
- Hover righe zinc-50
- Badge status con colori semantici coerenti

### Bottoni
- Primary: emerald-500, hover emerald-600
- Focus ring: emerald
- Destructive: invariato

### Invarianti (NON toccare)
- Struttura pagine, routing, layout grid
- Logica componenti (form, filtri, API)
- Componenti shadcn/ui base — solo CSS variables

---

## 4. Animazioni e Micro-interazioni

### Landing Page

**Hero Animation `<UptimeHeroAnimation />`:**
- SVG con linea uptime che si disegna (stroke-dasharray)
- Ping dots pulsanti (scale + opacity keyframes)
- Numeri response time con effetto slot machine
- Tutto emerald/teal, `prefers-reduced-motion` rispettato

**Scroll Animations:**
- fade-in + translateY(20px → 0), 600ms
- Easing: cubic-bezier(0.16, 1, 0.3, 1) (easeOutExpo)
- Stagger 100ms tra elementi
- Hook custom `useScrollReveal()` con IntersectionObserver

**Counter Animation (stats):**
- Count-up da 0, 2s con decelerate easing
- Geist Mono con separatori migliaia

**Navbar:**
- Trasparente → glassmorphism dopo 50px scroll, 300ms

### Dashboard

**Transizioni CSS globali:**
- Hover: transition all 150ms ease
- Card hover: shadow-md → shadow-lg + translateY(-1px)
- Bottoni: scale(0.98) on :active

**Status pulse (solo CSS):**
```css
@keyframes pulse-online {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}
```

**Loading states:**
- Skeleton shimmer allineato al tema
- Spinner emerald custom

**Toast notifications:**
- Slide-in da destra con bounce
- Bordo sinistro colorato per severity

### Performance
- Solo transform + opacity (GPU-accelerated)
- will-change solo dove necessario
- Rispetto prefers-reduced-motion
- Zero librerie esterne aggiunte
