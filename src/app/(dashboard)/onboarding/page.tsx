'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Globe, Bell, Puzzle, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: Globe,
    title: 'Aggiungi il tuo primo sito',
    description:
      'Inizia aggiungendo il primo sito da monitorare. Webmaster Monitor controllerà uptime, SSL e performance in tempo reale.',
    cta: 'Aggiungi sito',
    href: '/sites/new',
    wordpressOnly: false,
  },
  {
    number: 2,
    icon: Bell,
    title: 'Configura le notifiche',
    description:
      'Imposta gli alert via email, Slack o Telegram per essere avvisato immediatamente quando qualcosa non va.',
    cta: 'Configura notifiche',
    href: '/settings',
    wordpressOnly: false,
  },
  {
    number: 3,
    icon: Puzzle,
    title: 'Installa il plugin',
    description:
      'Se gestisci siti WordPress, installa il nostro plugin per sincronizzare aggiornamenti, plugin e temi direttamente dalla dashboard.',
    cta: 'Scopri il plugin',
    href: '/plugin',
    wordpressOnly: true,
  },
];

export default function OnboardingPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(' ')[0] ?? null;

  return (
    <div>
      <PageHeader
        title="Benvenuto"
        description="Configura il tuo account in pochi passi"
      />

      <div className="p-6 max-w-2xl">
        {/* Welcome header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Benvenuto su Webmaster Monitor{userName ? `, ${userName}` : ''}!
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Segui questi passi per iniziare a monitorare i tuoi siti.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="border border-zinc-200 dark:border-white/10 rounded-lg p-4 bg-white dark:bg-zinc-900 flex items-start gap-4"
              >
                {/* Number badge */}
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-semibold border border-emerald-500/20">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="flex-shrink-0 h-8 w-8 rounded-md border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {step.title}
                    </h3>
                    {step.wordpressOnly && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 font-medium leading-none">
                        WordPress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex-shrink-0">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={step.href}>{step.cta}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Skip link */}
        <div className="mt-8 flex items-center gap-2 text-sm text-zinc-500">
          <CheckCircle2 className="h-4 w-4 text-zinc-400" />
          <Link
            href="/dashboard"
            className="hover:text-emerald-500 transition-colors underline underline-offset-4"
          >
            Salta e vai alla dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
