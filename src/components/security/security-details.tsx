'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Lock,
  Package,
  Settings,
  ShieldCheck,
  FileWarning,
  AlertTriangle,
} from 'lucide-react';
import type { SecurityScan } from '@/types/database';

interface SecurityDetailsProps {
  scan: SecurityScan;
}

function StatusIcon({ positive }: { positive: boolean | null }) {
  if (positive === null) {
    return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
  }
  return positive ? (
    <CheckCircle2 className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );
}

function DetailItem({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean | null;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{value}</span>
        <StatusIcon positive={positive} />
      </div>
    </div>
  );
}

export function SecurityDetails({ scan }: SecurityDetailsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* SSL Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            SSL & HTTPS
            <Badge variant="outline" className="ml-auto">
              {scan.ssl_score}/25
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailItem
            label="Certificato SSL valido"
            value={scan.ssl_valid ? 'Si' : 'No'}
            positive={scan.ssl_valid}
          />
          <DetailItem
            label="HTTPS forzato"
            value={scan.https_forced ? 'Si' : 'No'}
            positive={scan.https_forced}
          />
          <DetailItem
            label="HSTS abilitato"
            value={scan.hsts_enabled ? 'Si' : 'No'}
            positive={scan.hsts_enabled}
          />
        </CardContent>
      </Card>

      {/* Versions Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Aggiornamenti
            <Badge variant="outline" className="ml-auto">
              {scan.versions_score}/25
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailItem
            label="WordPress aggiornato"
            value={scan.wp_updated ? 'Si' : 'No'}
            positive={scan.wp_updated}
          />
          <DetailItem
            label="Plugin aggiornati"
            value={scan.plugins_updated ? 'Si' : 'No'}
            positive={scan.plugins_updated}
          />
          <DetailItem
            label="Temi aggiornati"
            value={scan.themes_updated ? 'Si' : 'No'}
            positive={scan.themes_updated}
          />
          <DetailItem
            label="Elementi obsoleti"
            value={String(scan.outdated_count)}
            positive={scan.outdated_count === 0 ? true : false}
          />
        </CardContent>
      </Card>

      {/* Configuration Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurazione
            <Badge variant="outline" className="ml-auto">
              {scan.config_score}/25
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailItem
            label="WP_DEBUG disabilitato"
            value={scan.debug_disabled ? 'Si' : 'No'}
            positive={scan.debug_disabled}
          />
          <DetailItem
            label="Editor file disabilitato"
            value={scan.file_editor_disabled ? 'Si' : 'No'}
            positive={scan.file_editor_disabled}
          />
          <DetailItem
            label="Directory listing disabilitato"
            value={scan.directory_listing_disabled ? 'Si' : 'No'}
            positive={scan.directory_listing_disabled}
          />
          <DetailItem
            label="Prefisso tabelle personalizzato"
            value={scan.default_prefix ? 'No (wp_)' : 'Si'}
            positive={!scan.default_prefix}
          />
        </CardContent>
      </Card>

      {/* Security Plugin Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Plugin Sicurezza
            <Badge variant="outline" className="ml-auto">
              {scan.security_plugin_score}/25
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DetailItem
            label="Plugin installato"
            value={scan.security_plugin_name || 'Nessuno'}
            positive={scan.security_plugin_name !== null}
          />
          <DetailItem
            label="Plugin attivo"
            value={scan.security_plugin_active ? 'Si' : 'No'}
            positive={scan.security_plugin_active}
          />
        </CardContent>
      </Card>

      {/* File Integrity Section */}
      {(scan.core_files_modified > 0 || scan.suspicious_files.length > 0) && (
        <Card className="md:col-span-2 border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
              <FileWarning className="h-4 w-4" />
              Integrita File
              <Badge variant="destructive" className="ml-auto">
                Attenzione
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {scan.core_files_modified > 0 && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  File core modificati
                </span>
                <Badge variant="destructive">{scan.core_files_modified}</Badge>
              </div>
            )}
            {scan.suspicious_files.length > 0 && (
              <div className="py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    File sospetti rilevati
                  </span>
                  <Badge variant="destructive">{scan.suspicious_files.length}</Badge>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <ul className="text-xs font-mono space-y-1">
                    {scan.suspicious_files.map((file, index) => (
                      <li key={index} className="text-red-700 dark:text-red-300">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
