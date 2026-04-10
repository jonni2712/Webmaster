# Professional Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Webmaster Monitor from an AI-generated template into a professional, competitive SaaS product with strong visual identity.

**Architecture:** Layered approach — first establish design tokens in CSS variables, then rewrite the landing page as a dark-mode showcase, then propagate the design system into the dashboard components. No logic changes, only visual/styling.

**Tech Stack:** Next.js 16, Tailwind CSS 4, CSS custom properties, SVG animations, IntersectionObserver API

**Design Doc:** `docs/plans/2026-04-10-professional-redesign-design.md`

---

## Task 1: Design System — CSS Variables & Palette

**Files:**
- Modify: `src/app/globals.css` (lines 1-128)

**Step 1: Replace the entire globals.css with the new design system**

Replace all CSS variables in `:root` and `.dark` with the emerald-based palette. Add new custom properties for status colors, glow effects, and landing-specific dark theme. Add the `.landing-dark` class for forced dark mode on landing page.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --breakpoint-xs: 480px;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

/* ===== LIGHT MODE (Dashboard default) ===== */
:root {
  --radius: 0.625rem;
  --background: #FAFAFA;
  --foreground: #18181B;
  --card: #FFFFFF;
  --card-foreground: #18181B;
  --popover: #FFFFFF;
  --popover-foreground: #18181B;
  --primary: #10B981;
  --primary-foreground: #FFFFFF;
  --secondary: #F4F4F5;
  --secondary-foreground: #18181B;
  --muted: #F4F4F5;
  --muted-foreground: #71717A;
  --accent: #F4F4F5;
  --accent-foreground: #18181B;
  --destructive: #EF4444;
  --border: #E4E4E7;
  --input: #E4E4E7;
  --ring: #10B981;
  --chart-1: #10B981;
  --chart-2: #0EA5E9;
  --chart-3: #F59E0B;
  --chart-4: #8B5CF6;
  --chart-5: #EC4899;
  --sidebar: #F4F4F5;
  --sidebar-foreground: #18181B;
  --sidebar-primary: #10B981;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #E4E4E7;
  --sidebar-accent-foreground: #18181B;
  --sidebar-border: #E4E4E7;
  --sidebar-ring: #10B981;

  /* Semantic status colors */
  --status-online: #10B981;
  --status-warning: #F59E0B;
  --status-error: #EF4444;
  --status-info: #0EA5E9;
}

/* ===== DARK MODE (Toggle in dashboard) ===== */
.dark {
  --background: #0A0A0A;
  --foreground: #FAFAFA;
  --card: #141414;
  --card-foreground: #FAFAFA;
  --popover: #141414;
  --popover-foreground: #FAFAFA;
  --primary: #34D399;
  --primary-foreground: #052E16;
  --secondary: #1C1C1C;
  --secondary-foreground: #FAFAFA;
  --muted: #1C1C1C;
  --muted-foreground: #A1A1AA;
  --accent: #1C1C1C;
  --accent-foreground: #FAFAFA;
  --destructive: #EF4444;
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.12);
  --ring: #10B981;
  --chart-1: #34D399;
  --chart-2: #38BDF8;
  --chart-3: #FBBF24;
  --chart-4: #A78BFA;
  --chart-5: #F472B6;
  --sidebar: #141414;
  --sidebar-foreground: #FAFAFA;
  --sidebar-primary: #34D399;
  --sidebar-primary-foreground: #052E16;
  --sidebar-accent: #1C1C1C;
  --sidebar-accent-foreground: #FAFAFA;
  --sidebar-border: rgba(255, 255, 255, 0.08);
  --sidebar-ring: #10B981;
}

/* ===== LANDING PAGE (Forced dark) ===== */
.landing-dark {
  --background: #0A0A0A;
  --foreground: #FAFAFA;
  --card: #141414;
  --card-foreground: #FAFAFA;
  --popover: #141414;
  --popover-foreground: #FAFAFA;
  --primary: #10B981;
  --primary-foreground: #FFFFFF;
  --secondary: #1C1C1C;
  --secondary-foreground: #FAFAFA;
  --muted: #1C1C1C;
  --muted-foreground: #A1A1AA;
  --accent: #1C1C1C;
  --accent-foreground: #FAFAFA;
  --destructive: #EF4444;
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.12);
  --ring: #10B981;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* ===== ANIMATIONS ===== */

/* Status pulse for online indicators */
@keyframes pulse-online {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.8); }
}

.animate-pulse-online {
  animation: pulse-online 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Scroll reveal animation */
@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-reveal-up {
  animation: reveal-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Counter number animation helper */
@keyframes count-fade {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-count {
  animation: count-fade 0.4s ease-out both;
}

/* Hero line draw */
@keyframes draw-line {
  to { stroke-dashoffset: 0; }
}

/* Hero dot pulse */
@keyframes dot-pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.6); opacity: 0.3; }
}

/* Glow pulse for CTA buttons */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
  50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.15); }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-pulse-online,
  .animate-reveal-up,
  .animate-count {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
```

**Step 2: Verify the build compiles**

Run: `cd "/Users/jonathanboccotti/Desktop/GitHub/Piattaforme/Webmaster Monitor/webmaster-platform" && npm run build 2>&1 | tail -20`
Expected: Build succeeds (CSS changes are non-breaking)

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "design: replace grayscale palette with emerald design system

New brand palette with emerald/teal accent, semantic status colors,
forced dark mode class for landing page, and animation keyframes."
```

---

## Task 2: Typography — Add Geist Mono Font

**Files:**
- Modify: `src/app/layout.tsx` (lines 1-110)

**Step 1: Add Geist Mono font alongside Inter**

Add the Geist Mono import from `next/font/google` (or `geist/font`) and apply both font CSS variables to the body element. The Inter font stays as primary, Geist Mono becomes available via `font-mono` utility.

In `layout.tsx`, update the font imports:

```tsx
import { Inter } from 'next/font/google';
import { GeistMono } from 'geist/font/mono';
```

Update the body className:
```tsx
<body className={`${inter.className} ${GeistMono.variable}`}>
```

If `geist` package is not installed, install it first:
```bash
npm install geist
```

**Step 2: Verify fonts load**

Run: `npm run dev` and check browser — Inter for body, Geist Mono available via `font-mono` class.

**Step 3: Commit**

```bash
git add src/app/layout.tsx package.json package-lock.json
git commit -m "design: add Geist Mono font for stats and data display"
```

---

## Task 3: Landing Page — Scroll Reveal Hook

**Files:**
- Create: `src/hooks/use-scroll-reveal.ts`

**Step 1: Create the useScrollReveal hook**

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px', once = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-scroll-reveal.ts
git commit -m "feat: add useScrollReveal hook for scroll-triggered animations"
```

---

## Task 4: Landing Page — Animated Counter Component

**Files:**
- Create: `src/components/landing/animated-counter.tsx`

**Step 1: Create the AnimatedCounter component**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  end,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const { ref, isVisible } = useScrollReveal<HTMLSpanElement>();
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Decelerate easing
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setCount(end);
      }
    }

    requestAnimationFrame(update);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString('it-IT')}{suffix}
    </span>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/landing/animated-counter.tsx
git commit -m "feat: add AnimatedCounter component with scroll-triggered count-up"
```

---

## Task 5: Landing Page — Hero Animation Component

**Files:**
- Create: `src/components/landing/uptime-hero-animation.tsx`

**Step 1: Create the UptimeHeroAnimation SVG component**

This is the visual centerpiece — an animated SVG showing an uptime graph being drawn, pulsing ping dots, and changing response time numbers. All CSS-animated, no JS animation libraries.

```tsx
'use client';

import { useEffect, useState } from 'react';

export function UptimeHeroAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate uptime line path points
  const points = [
    [0, 60], [40, 55], [80, 58], [120, 30], [160, 35],
    [200, 25], [240, 40], [280, 20], [320, 28], [360, 15],
    [400, 22], [440, 18], [480, 25], [520, 12], [560, 20],
  ];

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
    .join(' ');

  const areaPath = `${linePath} L 560 100 L 0 100 Z`;

  const totalLength = 900; // Approximate path length

  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Glow background */}
      <div
        className="absolute inset-0 -m-8 rounded-3xl opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.2), transparent 70%)',
        }}
      />

      {/* Main SVG */}
      <svg
        viewBox="0 0 560 140"
        fill="none"
        className="w-full h-auto relative z-10"
        aria-hidden="true"
      >
        {/* Grid lines */}
        {[20, 40, 60, 80, 100].map((y) => (
          <line
            key={y}
            x1="0" y1={y} x2="560" y2={y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Area fill gradient */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>

        {/* Area under curve */}
        {mounted && (
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            className="animate-reveal-up"
            style={{ animationDelay: '0.8s' }}
          />
        )}

        {/* Uptime line that draws itself */}
        {mounted && (
          <path
            d={linePath}
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            style={{
              strokeDasharray: totalLength,
              strokeDashoffset: totalLength,
              animation: `draw-line 2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards`,
            }}
          />
        )}

        {/* Ping dots */}
        {mounted && [
          { cx: 200, cy: 25, delay: '1.2s' },
          { cx: 360, cy: 15, delay: '1.6s' },
          { cx: 520, cy: 12, delay: '2.0s' },
        ].map((dot, i) => (
          <g key={i}>
            {/* Pulse ring */}
            <circle
              cx={dot.cx} cy={dot.cy} r="6"
              fill="none"
              stroke="#10B981"
              strokeWidth="1"
              opacity="0"
              style={{
                animation: `dot-pulse 2s ease-in-out ${dot.delay} infinite`,
                transformOrigin: `${dot.cx}px ${dot.cy}px`,
              }}
            />
            {/* Solid dot */}
            <circle
              cx={dot.cx} cy={dot.cy} r="3"
              fill="#10B981"
              className="animate-reveal-up"
              style={{ animationDelay: dot.delay }}
            />
          </g>
        ))}
      </svg>

      {/* Floating stat cards */}
      {mounted && (
        <>
          <div
            className="absolute top-2 right-0 bg-[#141414] border border-white/10 rounded-lg px-3 py-2 animate-reveal-up"
            style={{ animationDelay: '1.4s' }}
          >
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Uptime</div>
            <div className="text-lg font-bold font-mono text-emerald-400">99.98%</div>
          </div>
          <div
            className="absolute bottom-4 left-0 bg-[#141414] border border-white/10 rounded-lg px-3 py-2 animate-reveal-up"
            style={{ animationDelay: '1.8s' }}
          >
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Response</div>
            <div className="text-lg font-bold font-mono text-sky-400">247ms</div>
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/landing/uptime-hero-animation.tsx
git commit -m "feat: add UptimeHeroAnimation SVG component with line draw and ping dots"
```

---

## Task 6: Landing Page — Section Wrapper Component

**Files:**
- Create: `src/components/landing/section.tsx`

**Step 1: Create reusable landing section wrapper with scroll reveal**

```tsx
'use client';

import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

interface LandingSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function LandingSection({ children, className, id }: LandingSectionProps) {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        'py-24 md:py-32 transition-all duration-700',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        className
      )}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/landing/section.tsx
git commit -m "feat: add LandingSection wrapper with scroll-triggered fade-in"
```

---

## Task 7: Landing Page — Complete Rewrite

**Files:**
- Modify: `src/app/page.tsx` (complete rewrite, all lines)

**Step 1: Rewrite the entire landing page**

This is the largest single change. Replace the current template-style landing with the new dark-mode design: glassmorphism navbar, hero with animation, alternating feature sections, animated stats, redesigned pricing, gradient CTA, and professional footer.

Key structural changes:
- Wrap entire page in `landing-dark` class (forced dark independent of system theme)
- Replace 6 identical feature cards with 3 alternating text/visual blocks
- Hero uses `UptimeHeroAnimation` component
- Stats use `AnimatedCounter`
- All sections use `LandingSection` for scroll animations
- Navbar transitions from transparent to glassmorphism on scroll

The full component is large (~500 lines). Key sections:

1. **Navbar**: Sticky with scroll-triggered glassmorphism background. Logo with emerald icon. CTA button with glow.
2. **Hero**: Two-column — headline with gradient text left, `UptimeHeroAnimation` right.
3. **Social Proof**: Minimal bar with stat text.
4. **Features**: 3 alternating blocks (uptime, SSL, performance) with tag badges and stylized mockup visuals.
5. **Stats**: 4 counters in `Geist Mono` with `AnimatedCounter`.
6. **Pricing**: 3 cards, Pro elevated with gradient border.
7. **CTA**: Full-width gradient emerald→sky section.
8. **Footer**: 4 columns on dark background, social hover emerald.

Write the complete `page.tsx` with all sections. Keep all Italian copy. Keep all existing links intact (login, register, contact, legal pages). Preserve the CookieSettingsButton in footer.

**Step 2: Verify the page renders**

Run: `npm run dev` and open `http://localhost:3000`
Expected: Dark landing page with emerald accents, animated hero, scroll animations working.

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "design: complete landing page rewrite with dark theme and animations

New sections: glassmorphism navbar, animated hero with uptime graph,
alternating feature blocks, counter stats, gradient CTA. All dark mode
with emerald/teal brand palette."
```

---

## Task 8: Auth Pages — Dark Theme Alignment

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

**Step 1: Add landing-dark wrapper to auth pages**

The login and register pages should match the landing dark theme for visual continuity. Wrap the main container of each auth page with the `landing-dark` class and update the card styling to use dark surface colors.

Add `className="landing-dark min-h-screen bg-background"` to the outermost div. The existing form components will automatically pick up the dark CSS variables.

Also update the logo link at the top to match the landing navbar logo (emerald icon).

**Step 2: Verify auth pages look consistent**

Run dev server, navigate to `/login` and `/register`.
Expected: Dark background, emerald accents, forms readable with proper contrast.

**Step 3: Commit**

```bash
git add src/app/(auth)/
git commit -m "design: align auth pages with landing dark theme"
```

---

## Task 9: Dashboard — Sidebar Branding

**Files:**
- Modify: `src/components/layout/sidebar.tsx` (key lines: 90-178)

**Step 1: Update sidebar styling**

Changes to make:
1. Active nav item: add left border indicator in emerald (`border-l-2 border-emerald-500`) and light emerald background
2. Active icon: change from default to `text-emerald-600` (light) / `text-emerald-400` (dark)
3. Logo section: update to match landing logo with emerald icon
4. Hover state: `hover:bg-emerald-50 dark:hover:bg-emerald-950/20`

Only change the className strings. Do not modify any logic, state management, or component structure.

**Step 2: Verify sidebar in dashboard**

Navigate to `/dashboard`. Active item should have emerald indicator. Hover should show subtle emerald tint.

**Step 3: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "design: brand sidebar with emerald active states and logo"
```

---

## Task 10: Dashboard — Card and Component Polish

**Files:**
- Modify: `src/components/ui/card.tsx` (line 9-11)
- Modify: `src/components/ui/button.tsx` (lines 7-37)
- Modify: `src/components/ui/badge.tsx` (lines 7-26)

**Step 1: Update Card component**

Change the base Card className from:
```
"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
```
to:
```
"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm hover:shadow-md transition-shadow duration-200"
```

This adds hover lift effect to all cards globally.

**Step 2: Update Button primary variant**

The button `default` variant currently uses `bg-primary`. Since our primary is now emerald, this will automatically be green. No code change needed — the CSS variables handle it. But verify the hover state looks good.

If the hover state needs adjustment, update the default variant hover class.

**Step 3: Update Badge default variant**

Ensure the default badge uses the emerald primary. Since it references `bg-primary`, it will pick up emerald automatically from CSS variables.

**Step 4: Verify components**

Navigate through dashboard pages. Cards should have subtle hover shadow. Buttons should be emerald. Badges should be emerald.

**Step 5: Commit**

```bash
git add src/components/ui/card.tsx src/components/ui/button.tsx src/components/ui/badge.tsx
git commit -m "design: add hover effects to cards, verify emerald propagation to buttons and badges"
```

---

## Task 11: Dashboard — Status Indicators Unification

**Files:**
- Modify: `src/components/dashboard/sites-grid.tsx` (lines 41-77)

**Step 1: Update StatusIndicator component**

Replace the current inline pulse animation and color classes with the new unified system:
- Online: `bg-emerald-500` with `animate-pulse-online` (the CSS class we defined in globals.css)
- Offline/Down: `bg-red-500` static
- Warning/Unknown: `bg-amber-500` with standard `animate-pulse`

Replace the current PlatformBadge hardcoded colors with semantic classes that reference the design system.

**Step 2: Verify status indicators**

Navigate to `/sites` or `/dashboard`. Status dots should use emerald for online with the new pulse animation.

**Step 3: Commit**

```bash
git add src/components/dashboard/sites-grid.tsx
git commit -m "design: unify status indicators with emerald pulse and semantic colors"
```

---

## Task 12: Dashboard — Chart Theme Alignment

**Files:**
- Modify: Any component using Recharts (search for `import.*from 'recharts'`)

**Step 1: Identify all Recharts usage**

Run: `grep -r "from 'recharts'" src/ --files-with-matches`

For each file found, update the color props to use the brand palette:
- Primary line/area: `#10B981` (emerald)
- Secondary line: `#0EA5E9` (sky)
- Warning: `#F59E0B` (amber)
- Grid stroke: `rgba(0,0,0,0.06)` (light) / `rgba(255,255,255,0.06)` (dark)
- Tooltip: dark background `#1a1a1a`, border `#10B981`, white text

**Step 2: Verify charts**

Navigate to a site detail page with performance/uptime data. Charts should use emerald/teal palette.

**Step 3: Commit**

```bash
git add src/
git commit -m "design: align Recharts color palette with emerald brand theme"
```

---

## Task 13: Final Build Verification

**Step 1: Run full build**

```bash
cd "/Users/jonathanboccotti/Desktop/GitHub/Piattaforme/Webmaster Monitor/webmaster-platform"
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Run dev server and test key pages**

Test the following pages visually:
- `/` — Landing page (dark, animated hero, scroll animations)
- `/login` — Auth page (dark themed)
- `/register` — Auth page (dark themed)
- `/dashboard` — Main dashboard (light, emerald accents)
- `/sites` — Sites list (emerald status indicators, card hover)
- `/sites/[id]` — Site detail with charts (emerald chart theme)

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "design: fix any remaining visual issues from redesign"
```

---

## Execution Notes

- **Zero logic changes**: Every task in this plan only modifies className strings, CSS variables, or creates new visual-only components. No API, database, auth, or business logic is touched.
- **Incremental commits**: Each task produces a working build. If something breaks, you can revert one task without losing others.
- **Order matters**: Tasks 1-2 must go first (design tokens). Tasks 3-6 are landing building blocks. Task 7 assembles them. Tasks 8-12 are dashboard polish and can be done in any order. Task 13 is final verification.
