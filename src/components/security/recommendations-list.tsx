'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Package,
  Settings,
  ShieldCheck,
  FileWarning,
} from 'lucide-react';
import {
  getPriorityColor,
  getPriorityLabel,
  getCategoryLabel,
} from '@/lib/security/recommendations';
import type { SecurityRecommendation, RecommendationPriority } from '@/types/database';

interface RecommendationsListProps {
  recommendations: SecurityRecommendation[];
}

const categoryIcons: Record<SecurityRecommendation['category'], React.ElementType> = {
  ssl: Lock,
  versions: Package,
  config: Settings,
  security_plugin: ShieldCheck,
  files: FileWarning,
};

function PrioritySummary({ recommendations }: { recommendations: SecurityRecommendation[] }) {
  const counts = {
    critical: recommendations.filter(r => r.priority === 'critical').length,
    high: recommendations.filter(r => r.priority === 'high').length,
    medium: recommendations.filter(r => r.priority === 'medium').length,
    low: recommendations.filter(r => r.priority === 'low').length,
  };

  return (
    <div className="flex flex-wrap gap-2">
      {counts.critical > 0 && (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
          {counts.critical} Critici
        </Badge>
      )}
      {counts.high > 0 && (
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
          {counts.high} Alti
        </Badge>
      )}
      {counts.medium > 0 && (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">
          {counts.medium} Medi
        </Badge>
      )}
      {counts.low > 0 && (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          {counts.low} Bassi
        </Badge>
      )}
    </div>
  );
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Raccomandazioni
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-muted-foreground text-center">
            Nessuna raccomandazione di sicurezza.
            <br />
            Il sito e ben configurato!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Raccomandazioni ({recommendations.length})
          </CardTitle>
          <PrioritySummary recommendations={recommendations} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="w-full">
          {recommendations.map((rec, index) => {
            const Icon = categoryIcons[rec.category];
            return (
              <AccordionItem key={rec.id} value={rec.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{rec.title}</span>
                    </div>
                    <Badge
                      className={`${getPriorityColor(rec.priority)} flex-shrink-0`}
                    >
                      {getPriorityLabel(rec.priority)}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-7 space-y-2">
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(rec.category)}
                      </Badge>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
