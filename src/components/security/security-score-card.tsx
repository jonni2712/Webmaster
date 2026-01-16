'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Lock,
  RefreshCw,
  Package,
  Settings,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { getScoreRating, getScoreColor, getScoreBgColor } from '@/lib/security/scanner';
import type { SecurityScan } from '@/types/database';

interface SecurityScoreCardProps {
  scan: SecurityScan | null;
  isLoading?: boolean;
  isScanning?: boolean;
  onScan?: () => void;
}

function ScoreGauge({ score }: { score: number }) {
  const rating = getScoreRating(score);
  const color = getScoreColor(score);

  const ratingLabels: Record<string, string> = {
    critical: 'Critico',
    poor: 'Scarso',
    fair: 'Sufficiente',
    good: 'Buono',
    excellent: 'Eccellente',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="text-muted stroke-current"
            strokeWidth="8"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
          />
          <circle
            className={`${color} stroke-current transition-all duration-500`}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
            strokeDasharray={`${(score / 100) * 264} 264`}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <Badge className={getScoreBgColor(score)}>
        {ratingLabels[rating]}
      </Badge>
    </div>
  );
}

function ScoreCategory({
  icon: Icon,
  label,
  score,
  maxScore,
}: {
  icon: React.ElementType;
  label: string;
  score: number;
  maxScore: number;
}) {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{label}</span>
        </div>
        <span className="text-sm font-medium">
          {score}/{maxScore}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

export function SecurityScoreCard({
  scan,
  isLoading,
  isScanning,
  onScan,
}: SecurityScoreCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!scan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <Shield className="h-16 w-16 text-muted-foreground/50" />
          <p className="text-muted-foreground text-center">
            Nessuna scansione di sicurezza disponibile.
            <br />
            Esegui una scansione per valutare la sicurezza del sito.
          </p>
          {onScan && (
            <Button onClick={onScan} disabled={isScanning}>
              {isScanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Esegui scansione
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Score
        </CardTitle>
        {onScan && (
          <Button variant="outline" size="sm" onClick={onScan} disabled={isScanning}>
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Score gauge */}
          <div className="flex justify-center md:justify-start">
            <ScoreGauge score={scan.security_score} />
          </div>

          {/* Score breakdown */}
          <div className="flex-1 space-y-4">
            <ScoreCategory
              icon={Lock}
              label="SSL & HTTPS"
              score={scan.ssl_score}
              maxScore={25}
            />
            <ScoreCategory
              icon={Package}
              label="Aggiornamenti"
              score={scan.versions_score}
              maxScore={25}
            />
            <ScoreCategory
              icon={Settings}
              label="Configurazione"
              score={scan.config_score}
              maxScore={25}
            />
            <ScoreCategory
              icon={ShieldCheck}
              label="Plugin Sicurezza"
              score={scan.security_plugin_score}
              maxScore={25}
            />
          </div>
        </div>

        {/* Last scan info */}
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
          Ultima scansione:{' '}
          {new Date(scan.scanned_at).toLocaleString('it-IT', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>
      </CardContent>
    </Card>
  );
}
