'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AlertCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BillingInfoForm } from './billing-info-form';

interface BillingData {
  plan: {
    id: string;
    name: string;
    priceEurCents: number;
    maxSites: number;
    maxTeamMembers: number;
  };
  subscription: {
    status: string | null;
    trialEndsAt: string | null;
    stripeSubscriptionId: string | null;
  };
  usage: {
    sites: { current: number; max: number };
    teamMembers: { current: number; max: number };
  };
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    priceEurCents: 0,
    maxSites: 3,
    maxTeamMembers: 1,
    features: ['3 siti', '1 membro', 'Monitoraggio base', 'Notifiche email'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceEurCents: 1900,
    maxSites: 25,
    maxTeamMembers: 5,
    features: ['25 siti', '5 membri', 'SSL & WHOIS', 'Slack, Telegram'],
  },
  {
    id: 'business',
    name: 'Business',
    priceEurCents: 4900,
    maxSites: 100,
    maxTeamMembers: 15,
    features: ['100 siti', '15 membri', 'API access', 'Priorità supporto'],
  },
  {
    id: 'agency',
    name: 'Agency',
    priceEurCents: 9900,
    maxSites: -1,
    maxTeamMembers: -1,
    features: ['Siti illimitati', 'Team illimitato', 'White label', 'SLA garantito'],
  },
];

const PLAN_BADGE_VARIANTS: Record<string, string> = {
  starter: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  pro: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  business: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  agency: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: {
    label: 'Attivo',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  trialing: {
    label: 'Prova gratuita',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
  past_due: {
    label: 'Pagamento scaduto',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-zinc-100 dark:bg-white/5',
        className
      )}
    />
  );
}

function UsageBar({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, (current / max) * 100);
  const isUnlimited = max <= 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
        <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
          {isUnlimited ? `${current} / ∞` : `${current} / ${max}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-white/5">
        {!isUnlimited && (
          <div
            className={cn(
              'h-1.5 rounded-full transition-all',
              pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  );
}

export function BillingTab() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);

  useEffect(() => {
    fetch('/api/billing/current')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch billing');
        return res.json();
      })
      .then((data) => setBilling(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success('Abbonamento attivato con successo!');
      window.history.replaceState({}, '', '/settings?tab=billing');
    }
    if (params.get('canceled') === 'true') {
      toast('Checkout annullato', { description: 'Puoi riprovare quando vuoi.' });
      window.history.replaceState({}, '', '/settings?tab=billing');
    }
  }, []);

  async function handleUpgrade(planId: string) {
    setUpgrading(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, annual: false }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpgrading(null);
    }
  }

  async function handleManage() {
    setManagingPortal(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setManagingPortal(false);
    }
  }

  const isFreePlan =
    !billing?.subscription?.stripeSubscriptionId ||
    billing.subscription.status === null;

  const isPaidPlan =
    billing?.subscription?.stripeSubscriptionId &&
    billing.subscription.status !== null;

  const currentPlanId = billing?.plan?.id ?? 'starter';
  const currentPlanIndex = PLANS.findIndex((p) => p.id === currentPlanId);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6 space-y-5">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !billing) {
    return (
      <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6">
        <div className="flex items-center gap-3 text-zinc-500">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-white">
              Errore nel caricamento
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Impossibile recuperare i dati di fatturazione. Ricarica la pagina.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = billing.subscription.status
    ? STATUS_LABELS[billing.subscription.status]
    : null;

  const priceLabel =
    billing.plan.priceEurCents === 0
      ? 'Gratuito'
      : `€${(billing.plan.priceEurCents / 100).toFixed(0)}/mo`;

  return (
    <div className="space-y-4">
      {/* Current Plan Card */}
      <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
              Piano attuale
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-zinc-900 dark:text-white">
                {billing.plan.name}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                  PLAN_BADGE_VARIANTS[currentPlanId] ?? PLAN_BADGE_VARIANTS.starter
                )}
              >
                {billing.plan.name}
              </span>
              {statusInfo && (
                <span
                  className={cn(
                    'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                    statusInfo.className
                  )}
                >
                  {statusInfo.label}
                </span>
              )}
            </div>
            <p className="text-sm font-mono text-zinc-500 mt-0.5">{priceLabel}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isPaidPlan && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={handleManage}
                  disabled={managingPortal}
                >
                  {managingPortal ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Gestisci abbonamento
                </Button>
                <button
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2"
                  onClick={() => {
                    const grid = document.getElementById('billing-plan-grid');
                    grid?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Cambia piano
                </button>
              </>
            )}
            {isFreePlan && (
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleUpgrade('pro')}
                disabled={upgrading === 'pro'}
              >
                {upgrading === 'pro' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : null}
                Upgrade a Pro
              </Button>
            )}
          </div>
        </div>

        {/* Trial notice */}
        {billing.subscription.status === 'trialing' &&
          billing.subscription.trialEndsAt && (
            <div className="flex items-center gap-2 rounded-md border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-900/10 px-3 py-2">
              <span className="text-xs text-sky-700 dark:text-sky-400">
                Prova gratuita fino al{' '}
                <span className="font-medium">
                  {format(new Date(billing.subscription.trialEndsAt), 'd MMMM yyyy', {
                    locale: it,
                  })}
                </span>
              </span>
            </div>
          )}

        {/* Past due notice */}
        {billing.subscription.status === 'past_due' && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-700 dark:text-red-400">
              Pagamento scaduto. Aggiorna il metodo di pagamento per evitare l'interruzione del servizio.
            </span>
          </div>
        )}

        {/* Usage */}
        <div className="space-y-3 pt-1">
          <UsageBar
            label="Siti utilizzati"
            current={billing.usage.sites.current}
            max={billing.usage.sites.max}
          />
          <UsageBar
            label="Membri team"
            current={billing.usage.teamMembers.current}
            max={billing.usage.teamMembers.max}
          />
        </div>
      </div>

      {/* Italian Billing Info Form — only shown once user has a Stripe subscription */}
      {billing?.subscription?.stripeSubscriptionId && (
        <BillingInfoForm />
      )}

      {/* Plan Comparison Grid */}
      <div
        id="billing-plan-grid"
        className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            Confronto piani
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Scegli il piano più adatto alle tue esigenze
          </p>
        </div>

        <div className="grid grid-cols-4 divide-x divide-zinc-100 dark:divide-white/5">
          {PLANS.map((plan, idx) => {
            const isCurrent = plan.id === currentPlanId;
            const isHigher = idx > currentPlanIndex;
            const isLower = idx < currentPlanIndex;
            const planPrice =
              plan.priceEurCents === 0
                ? 'Gratuito'
                : `€${(plan.priceEurCents / 100).toFixed(0)}/mo`;

            return (
              <div
                key={plan.id}
                className={cn(
                  'flex flex-col p-4 space-y-3',
                  isCurrent && 'bg-zinc-50 dark:bg-white/[0.03]'
                )}
              >
                {/* Plan header */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                      {plan.name}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex items-center rounded px-1 py-0 text-[9px] font-medium uppercase tracking-wide bg-zinc-200 text-zinc-600 dark:bg-white/10 dark:text-zinc-400">
                        Attuale
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-mono text-zinc-700 dark:text-zinc-300">
                    {planPrice}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-1 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-1"
                    >
                      <span className="text-emerald-500 mt-px leading-none">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Action */}
                <div>
                  {isCurrent ? (
                    <div className="h-7 flex items-center">
                      <span className="text-[10px] text-zinc-400">Piano attuale</span>
                    </div>
                  ) : isHigher ? (
                    <Button
                      size="sm"
                      className="h-7 w-full text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={upgrading === plan.id}
                    >
                      {upgrading === plan.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Upgrade'
                      )}
                    </Button>
                  ) : isLower ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-full text-[11px]"
                      onClick={handleManage}
                      disabled={managingPortal}
                    >
                      {managingPortal ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Downgrade'
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
