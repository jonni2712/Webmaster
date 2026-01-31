# Contributing to Webmaster Monitor

Grazie per il tuo interesse a contribuire! Questo documento fornisce le linee guida per contribuire al progetto.

## Come Contribuire

### Segnalare Bug

1. Cerca nelle [issues esistenti](https://github.com/jonni2712/Webmaster/issues) per evitare duplicati
2. Crea una nuova issue usando il template "Bug Report"
3. Includi:
   - Descrizione chiara del bug
   - Passi per riprodurre
   - Comportamento atteso vs attuale
   - Screenshot se utili
   - Ambiente (OS, browser, versione)

### Proporre Funzionalità

1. Apri una [Discussion](https://github.com/jonni2712/Webmaster/discussions) per discutere l'idea
2. Se approvata, crea una issue con il template "Feature Request"
3. Attendi feedback prima di iniziare lo sviluppo

### Inviare Pull Request

1. **Fork** il repository
2. **Crea un branch** dal `main`:
   ```bash
   git checkout -b feature/nome-feature
   # oppure
   git checkout -b fix/nome-bug
   ```

3. **Sviluppa** seguendo le convenzioni (vedi sotto)

4. **Testa** le modifiche:
   ```bash
   npm run lint
   npm run type-check
   npm run test
   ```

5. **Commit** usando [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: aggiungi monitoraggio DNS"
   git commit -m "fix: correggi calcolo uptime"
   git commit -m "docs: aggiorna guida self-hosting"
   ```

6. **Push** e crea PR:
   ```bash
   git push origin feature/nome-feature
   ```

7. **Descrivi** le modifiche nella PR usando il template

## Convenzioni Codice

### TypeScript

- Usa TypeScript per tutto il codice
- Definisci tipi espliciti (evita `any`)
- Usa interface per oggetti, type per union/alias

```typescript
// Good
interface Site {
  id: string;
  url: string;
  status: 'up' | 'down';
}

// Avoid
const site: any = { ... };
```

### React/Next.js

- Usa componenti funzionali con hooks
- Preferisci Server Components dove possibile
- Usa `use client` solo quando necessario

```tsx
// Server Component (default)
export default async function Page() {
  const data = await getData();
  return <div>{data}</div>;
}

// Client Component (quando serve interattività)
'use client';
export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Stile

- Usa Tailwind CSS per lo styling
- Segui l'ordine delle classi di Tailwind
- Usa i componenti shadcn/ui esistenti

```tsx
// Good
<Button variant="outline" size="sm">
  Click me
</Button>

// Avoid custom CSS quando Tailwind basta
```

### Database

- Usa Supabase client da `@/lib/supabase`
- Rispetta la struttura multi-tenant (tenant_id)
- Considera RLS nelle query

### Commit Messages

Segui [Conventional Commits](https://www.conventionalcommits.org/):

| Tipo | Descrizione |
|------|-------------|
| `feat` | Nuova funzionalità |
| `fix` | Bug fix |
| `docs` | Documentazione |
| `style` | Formattazione (no logic change) |
| `refactor` | Refactoring |
| `test` | Test |
| `chore` | Manutenzione |

Esempi:
```
feat(monitoring): add DNS check support
fix(auth): resolve session timeout issue
docs(readme): update self-hosting guide
```

## Setup Sviluppo

```bash
# Clone
git clone https://github.com/jonni2712/Webmaster.git
cd Webmaster

# Install
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Run
npm run dev
```

## Struttura Directory

```
src/
├── app/              # Next.js App Router
├── components/       # React components
│   ├── ui/          # shadcn/ui base components
│   └── ...          # Feature components
├── lib/             # Utilities, configs
└── types/           # TypeScript types
```

## Test

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## Domande?

- 💬 [GitHub Discussions](https://github.com/jonni2712/Webmaster/discussions)
- 📧 Email: contributi@webmaster-monitor.com

## Licenza

Contribuendo, accetti che i tuoi contributi siano rilasciati sotto la licenza [AGPL-3.0](LICENSE).
