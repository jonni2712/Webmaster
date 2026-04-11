'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Clock,
  Bell,
  RefreshCw,
  BarChart3,
  Users,
  Shield,
  ShoppingCart,
  Search,
  Workflow,
  Palette,
  Rocket,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';

interface RoadmapFeature {
  name: string;
  completed: boolean;
}

interface RoadmapVersion {
  version: string;
  title: string;
  icon: React.ElementType;
  status: 'released' | 'in-progress' | 'planned';
  progress: number;
  features: RoadmapFeature[];
}

const roadmapData: RoadmapVersion[] = [
  {
    version: 'v1.0.0',
    title: 'Fondamenta',
    icon: Rocket,
    status: 'released',
    progress: 100,
    features: [
      { name: 'Autenticazione OAuth (GitHub, Google)', completed: true },
      { name: 'Autenticazione Email/Password', completed: true },
      { name: 'Multi-tenant architecture', completed: true },
      { name: 'Dashboard con overview siti', completed: true },
      { name: 'Gestione siti (CRUD)', completed: true },
      { name: 'Gestione clienti', completed: true },
      { name: 'Monitoraggio Uptime', completed: true },
      { name: 'Monitoraggio SSL', completed: true },
      { name: 'Monitoraggio Performance (PageSpeed)', completed: true },
      { name: 'Plugin WordPress', completed: true },
      { name: 'Sistema di alert base', completed: true },
    ],
  },
  {
    version: 'v1.1.0',
    title: 'Notifiche e Alert',
    icon: Bell,
    status: 'released',
    progress: 100,
    features: [
      { name: 'Notifiche email per downtime', completed: true },
      { name: 'Notifiche email per SSL in scadenza', completed: true },
      { name: 'Notifiche Telegram', completed: true },
      { name: 'Notifiche Slack', completed: true },
      { name: 'Notifiche Discord', completed: true },
      { name: 'Webhook personalizzati', completed: true },
      { name: 'Configurazione soglie per sito', completed: true },
      { name: 'Digest giornaliero/settimanale', completed: true },
    ],
  },
  {
    version: 'v1.2.0',
    title: 'Gestione Aggiornamenti',
    icon: RefreshCw,
    status: 'released',
    progress: 100,
    features: [
      { name: 'Lista aggiornamenti disponibili', completed: true },
      { name: 'Aggiornamento singolo plugin da remoto', completed: true },
      { name: 'Aggiornamento massivo (bulk update)', completed: true },
      { name: 'Aggiornamento temi da remoto', completed: true },
      { name: 'Aggiornamento WordPress core', completed: true },
      { name: 'Alert aggiornamenti critici', completed: true },
      { name: 'Auto-sync nuovi siti', completed: true },
      { name: 'Sync-all tutti i siti', completed: true },
      { name: 'Gestione tag per siti', completed: true },
      { name: 'Filtro siti per tag', completed: true },
    ],
  },
  {
    version: 'v1.3.0',
    title: 'Report e Analytics',
    icon: BarChart3,
    status: 'released',
    progress: 100,
    features: [
      { name: 'Date range selector (7d, 30d, 90d, 6m, 1y)', completed: true },
      { name: 'Grafici storici uptime', completed: true },
      { name: 'Grafici tempi di risposta', completed: true },
      { name: 'Grafici Performance Score', completed: true },
      { name: 'Grafici Core Web Vitals (LCP, FID, CLS, TTFB)', completed: true },
      { name: 'Summary statistiche periodo', completed: true },
      { name: 'Export dati CSV', completed: true },
    ],
  },
  {
    version: 'v1.4.0',
    title: 'Gestione Team',
    icon: Users,
    status: 'released',
    progress: 100,
    features: [
      { name: 'Invito membri al team via email', completed: true },
      { name: 'Ruoli e permessi (owner, admin, member, viewer)', completed: true },
      { name: 'Activity log completo', completed: true },
      { name: 'Assegnazione siti a membri specifici', completed: true },
      { name: 'Tab Team in Settings', completed: true },
    ],
  },
  {
    version: 'v1.5.0',
    title: 'Backup e Sicurezza',
    icon: Shield,
    status: 'in-progress',
    progress: 80,
    features: [
      { name: 'Integrazione backup da plugin WP', completed: true },
      { name: 'Download backup da piattaforma', completed: true },
      { name: 'Scansione malware', completed: true },
      { name: 'Security score per sito', completed: true },
      { name: 'Raccomandazioni sicurezza', completed: true },
    ],
  },
  {
    version: 'v1.6.0',
    title: 'E-commerce Dashboard',
    icon: ShoppingCart,
    status: 'planned',
    progress: 0,
    features: [
      { name: 'Integrazione WooCommerce', completed: false },
      { name: 'Dashboard vendite', completed: false },
      { name: 'Grafici revenue', completed: false },
      { name: 'Alert ordini', completed: false },
      { name: 'Integrazione PrestaShop', completed: false },
    ],
  },
  {
    version: 'v1.7.0',
    title: 'SEO Monitoring',
    icon: Search,
    status: 'planned',
    progress: 0,
    features: [
      { name: 'Tracking posizioni keyword', completed: false },
      { name: 'Integrazione Search Console', completed: false },
      { name: 'Integrazione Google Analytics 4', completed: false },
      { name: 'Alert calo traffico', completed: false },
      { name: 'Broken links monitoring', completed: false },
    ],
  },
  {
    version: 'v1.8.0',
    title: 'Automazioni',
    icon: Workflow,
    status: 'planned',
    progress: 0,
    features: [
      { name: 'Workflow automatici', completed: false },
      { name: 'Auto-update plugin sicuri', completed: false },
      { name: 'Auto-backup prima update', completed: false },
      { name: 'Scheduled maintenance mode', completed: false },
      { name: 'Schedulazione aggiornamenti', completed: false },
    ],
  },
  {
    version: 'v2.0.0',
    title: 'White Label e API',
    icon: Palette,
    status: 'planned',
    progress: 0,
    features: [
      { name: 'White label completo', completed: false },
      { name: 'Custom domain', completed: false },
      { name: 'API pubblica documentata', completed: false },
      { name: 'Webhook per integrazioni', completed: false },
      { name: 'Mobile App', completed: false },
    ],
  },
];

function StatusBadge({ status }: { status: 'released' | 'in-progress' | 'planned' }) {
  const config = {
    released: { label: 'Rilasciato', className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
    'in-progress': { label: 'In Sviluppo', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
    planned: { label: 'Pianificato', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  );
}

function VersionCard({ item }: { item: RoadmapVersion }) {
  const Icon = item.icon;
  const completedCount = item.features.filter(f => f.completed).length;

  return (
    <div className={`bg-white dark:bg-[#0c0c0c] border rounded-lg p-4 transition-colors ${
      item.status === 'released' ? 'border-emerald-200 dark:border-emerald-800/50' :
      item.status === 'in-progress' ? 'border-blue-200 dark:border-blue-800/50' :
      'border-zinc-200 dark:border-white/5'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0 ${
            item.status === 'released' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
            item.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
            'bg-zinc-100 dark:bg-white/5'
          }`}>
            <Icon className={`h-3.5 w-3.5 ${
              item.status === 'released' ? 'text-emerald-600 dark:text-emerald-400' :
              item.status === 'in-progress' ? 'text-blue-600 dark:text-blue-400' :
              'text-zinc-400'
            }`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">
              <span className="font-mono">{item.version}</span>
              <span className="font-normal text-zinc-400 mx-1.5">—</span>
              {item.title}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">{completedCount}/{item.features.length} completate</p>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>
      {item.status !== 'planned' && (
        <Progress value={item.progress} className="h-1 mb-3" />
      )}
      <ul className="space-y-1">
        {item.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            {feature.completed ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="h-3 w-3 text-zinc-300 dark:text-zinc-600 flex-shrink-0" />
            )}
            <span className={feature.completed ? 'text-zinc-400 line-through' : 'text-zinc-600 dark:text-zinc-400'}>
              {feature.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RoadmapPage() {
  const totalFeatures = roadmapData.reduce((acc, v) => acc + v.features.length, 0);
  const completedFeatures = roadmapData.reduce((acc, v) => acc + v.features.filter(f => f.completed).length, 0);
  const overallProgress = Math.round((completedFeatures / totalFeatures) * 100);

  return (
    <div>
      <PageHeader
        title="Roadmap"
        description="Scopri le funzionalita' in arrivo e lo stato di sviluppo della piattaforma"
      />

      <div className="p-6 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Funzionalita' completate"
            value={completedFeatures}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          />
          <StatCard
            label="Totale funzionalita'"
            value={totalFeatures}
            icon={<Calendar className="h-4 w-4 text-zinc-400" />}
          />
          <StatCard
            label="Progresso generale"
            value={`${overallProgress}%`}
            change={{ value: `${completedFeatures} di ${totalFeatures} completate` }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500">Rilasciato</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs text-zinc-500">In Sviluppo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            <span className="text-xs text-zinc-500">Pianificato</span>
          </div>
        </div>

        {/* Versions Grid */}
        <div className="grid gap-3 md:grid-cols-2">
          {roadmapData.map((item) => (
            <VersionCard key={item.version} item={item} />
          ))}
        </div>

        {/* Feedback */}
        <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-white mb-0.5">Hai suggerimenti?</p>
          <p className="text-xs text-zinc-500 mb-3">
            Siamo sempre alla ricerca di feedback per migliorare la piattaforma.
          </p>
          <a
            href="mailto:support@webmaster-monitor.com?subject=Feedback%20Roadmap"
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Invia il tuo feedback
          </a>
        </div>
      </div>
    </div>
  );
}
