'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, X, ChevronDown, ChevronUp } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Per chi inizia a monitorare i propri siti.',
    highlight: false,
    badge: null,
    features: [
      '5 siti monitorati',
      'Check ogni 15 minuti',
      'Storico 7 giorni',
      '1 membro del team',
      'Notifiche email',
      'Dashboard base',
      'Monitoraggio SSL',
      'Monitoraggio uptime',
    ],
    cta: 'Inizia gratis',
    ctaHref: '/register',
  },
  {
    name: 'Pro',
    monthlyPrice: 19,
    annualPrice: 16,
    description: 'Per freelance e professionisti con piu\u0027 clienti.',
    highlight: false,
    badge: null,
    features: [
      '30 siti monitorati',
      'Check ogni 5 minuti',
      'Storico 30 giorni',
      '5 membri del team',
      'Notifiche email, Slack, Telegram, Discord',
      'Scanner DNS/SSL/CMS',
      'Monitoraggio performance',
      'Alert personalizzabili',
    ],
    cta: 'Inizia con Pro',
    ctaHref: '/register?plan=pro',
  },
  {
    name: 'Business',
    monthlyPrice: 49,
    annualPrice: 41,
    description: 'Per agenzie con portfolio clienti strutturato.',
    highlight: true,
    badge: 'Piu\u0027 popolare',
    features: [
      '100 siti monitorati',
      'Check ogni 3 minuti',
      'Storico 90 giorni',
      '10 membri del team',
      'Tutte le notifiche Pro',
      'Gestione clienti (CRM)',
      'Report esportabili (PDF/CSV)',
      'API pubblica',
    ],
    cta: 'Inizia con Business',
    ctaHref: '/register?plan=business',
  },
  {
    name: 'Agency',
    monthlyPrice: 129,
    annualPrice: 107,
    description: 'Per grandi agenzie con esigenze avanzate.',
    highlight: false,
    badge: null,
    features: [
      '300 siti monitorati',
      'Check ogni minuto',
      'Storico 1 anno',
      '50 membri del team',
      'Tutte le notifiche Business',
      'Agent cPanel/Plesk',
      'Account manager dedicato',
      'Supporto dedicato prioritario',
    ],
    cta: 'Contattaci',
    ctaHref: '/contact',
  },
];

type FeatureValue = boolean | string;

interface ComparisonFeature {
  label: string;
  values: [FeatureValue, FeatureValue, FeatureValue, FeatureValue];
}

const comparisonFeatures: ComparisonFeature[] = [
  { label: 'Siti monitorati', values: ['5', '30', '100', '300'] },
  { label: 'Intervallo check', values: ['15 min', '5 min', '3 min', '1 min'] },
  { label: 'Storico dati', values: ['7 giorni', '30 giorni', '90 giorni', '1 anno'] },
  { label: 'Team members', values: ['1', '5', '10', '50'] },
  { label: 'Notifiche email', values: [true, true, true, true] },
  { label: 'Slack / Telegram / Discord', values: [false, true, true, true] },
  { label: 'Scanner DNS/SSL/CMS', values: [false, true, true, true] },
  { label: 'Gestione clienti (CRM)', values: [false, false, true, true] },
  { label: 'Report esportabili', values: [false, false, true, true] },
  { label: 'API pubblica', values: [false, false, true, true] },
  { label: 'Agent cPanel/Plesk', values: [false, false, false, true] },
  { label: 'Account manager', values: [false, false, false, true] },
  {
    label: 'Supporto',
    values: ['Community', 'Prioritario', 'Prioritario', 'Dedicato'],
  },
];

const faqs = [
  {
    q: 'Posso cambiare piano in qualsiasi momento?',
    a: 'Si\u0027, puoi fare upgrade o downgrade del tuo piano in qualsiasi momento. Le modifiche saranno effettive dal prossimo ciclo di fatturazione.',
  },
  {
    q: 'Cosa succede se supero il limite di siti?',
    a: 'Ti invieremo una notifica quando sei vicino al limite. Potrai fare upgrade o rimuovere siti dal monitoraggio.',
  },
  {
    q: 'Offrite uno sconto per il pagamento annuale?',
    a: 'Si\u0027, con il piano annuale risparmi il 17% rispetto al piano mensile. Il pagamento viene effettuato in un\u2019unica soluzione all\u2019inizio del periodo.',
  },
  {
    q: 'I dati sono ospitati in Europa?',
    a: 'Si\u0027. Tutti i dati sono ospitati su server europei e siamo pienamente conformi al GDPR.',
  },
  {
    q: 'Posso usare Webmaster Monitor gratuitamente?',
    a: 'Si\u0027, il piano Starter e\u0027 gratuito per sempre. Non richiede carta di credito.',
  },
];

function Check() {
  return <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />;
}

function Cross() {
  return <X className="w-5 h-5 text-zinc-700 mx-auto" />;
}

function FeatureCell({ value }: { value: FeatureValue }) {
  if (typeof value === 'boolean') {
    return value ? <Check /> : <Cross />;
  }
  return <span className="text-sm text-zinc-300">{value}</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left text-white hover:bg-white/5 transition-colors"
      >
        <span className="font-medium">{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-zinc-400 shrink-0 ml-4" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0 ml-4" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-white/10 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export function PricingContent() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="container mx-auto px-4 md:px-6 py-24">
      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Scegli il piano giusto per te
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Nessun costo nascosto. Puoi cambiare piano in qualsiasi momento.
          Il piano Starter e&apos; gratuito per sempre.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-sm font-medium ${!annual ? 'text-white' : 'text-zinc-500'}`}>
            Mensile
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              annual ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
            aria-pressed={annual}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                annual ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-white' : 'text-zinc-500'}`}>
            Annuale
          </span>
          {annual && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
              -17%
            </span>
          )}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {plans.map((plan) => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice;
          return (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.highlight
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-1">{plan.name}</h2>
                <p className="text-zinc-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {price === 0 ? 'Gratis' : `€${price}`}
                  </span>
                  {price > 0 && (
                    <span className="text-zinc-500 text-sm">/mese</span>
                  )}
                </div>
                {annual && price > 0 && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Fatturato annualmente (€{price * 12}/anno)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block text-center py-2.5 px-4 rounded-xl font-medium text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Confronto completo delle funzionalita&apos;
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-zinc-400 font-medium w-1/3">Funzionalita&apos;</th>
                {plans.map((plan) => (
                  <th
                    key={plan.name}
                    className={`text-center p-4 font-semibold ${
                      plan.highlight ? 'text-emerald-400' : 'text-white'
                    }`}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feature, i) => (
                <tr
                  key={feature.label}
                  className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
                >
                  <td className="p-4 text-zinc-300">{feature.label}</td>
                  {feature.values.map((value, j) => (
                    <td key={j} className="p-4 text-center">
                      <FeatureCell value={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise Callout */}
      <div className="mb-20 rounded-2xl border border-white/10 bg-white/5 p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Hai piu&apos; di 300 siti?
        </h2>
        <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
          Offriamo soluzioni Enterprise su misura per grandi agenzie e provider di hosting.
          Prezzi dedicati, SLA garantiti e supporto tecnico avanzato.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors"
        >
          Contattaci per un preventivo
        </Link>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Domande frequenti</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
