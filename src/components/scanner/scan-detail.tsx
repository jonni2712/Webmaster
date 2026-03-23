'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import type { ExternalScanResult } from '@/types/database';
import { ScanBadgesRow } from './scan-badges';

interface ScanDetailProps {
  scan: ExternalScanResult;
  onRescan?: () => void;
  isRescanning?: boolean;
}

export function ScanDetail({ scan, onRescan, isRescanning }: ScanDetailProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      {/* Inline badges */}
      <div className="flex items-center justify-between">
        <ScanBadgesRow data={scan} />
        <div className="flex items-center gap-1">
          {onRescan && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onRescan}
              disabled={isRescanning}
            >
              {isRescanning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <Card className="bg-muted/30">
          <CardContent className="p-3 space-y-3 text-xs">
            {/* DNS Records */}
            {(scan.dns_a_records?.length > 0 || scan.dns_mx_records?.length > 0) && (
              <Section title="DNS Records">
                {scan.dns_a_records?.map((ip, i) => (
                  <RecordRow key={i} type="A" value={ip} />
                ))}
                {scan.dns_cname && <RecordRow type="CNAME" value={scan.dns_cname} />}
                {scan.dns_mx_records?.map((mx, i) => (
                  <RecordRow key={i} type="MX" value={`${mx.priority} ${mx.exchange}`} />
                ))}
                {scan.dns_ns_records?.map((ns, i) => (
                  <RecordRow key={i} type="NS" value={ns} />
                ))}
              </Section>
            )}

            {/* Redirect Chain */}
            {scan.http_redirect_chain && scan.http_redirect_chain.length > 0 && (
              <Section title="Redirect Chain">
                {scan.http_redirect_chain.map((hop, i) => (
                  <div key={i} className="flex gap-2 font-mono">
                    <Badge variant="outline" className="text-[9px] h-4 px-1">{hop.status}</Badge>
                    <span className="truncate">{hop.url}</span>
                  </div>
                ))}
                <div className="flex gap-2 font-mono text-green-600">
                  <Badge variant="default" className="text-[9px] h-4 px-1 bg-green-600">{scan.http_status}</Badge>
                  <span className="truncate">{scan.http_final_url}</span>
                </div>
              </Section>
            )}

            {/* CMS Detection */}
            {scan.cms_detected && (
              <Section title="CMS Detection">
                <div className="space-y-1">
                  <div>Tipo: <strong>{scan.cms_detected}</strong> {scan.cms_version && `v${scan.cms_version}`}</div>
                  <div>Metodo: {scan.cms_detection_method} (confidence: {scan.cms_confidence})</div>
                  {scan.cms_extras && Object.keys(scan.cms_extras).length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(scan.cms_extras).map(([key, val]) =>
                        val ? (
                          <Badge key={key} variant="secondary" className="text-[9px] h-4">
                            {key}
                          </Badge>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* WHOIS */}
            {scan.whois_registrar && (
              <Section title="WHOIS">
                <div>Registrar: <strong>{scan.whois_registrar}</strong></div>
                {scan.whois_expires_at && (
                  <div>Scadenza: {new Date(scan.whois_expires_at).toLocaleDateString('it-IT')}</div>
                )}
                {scan.whois_nameservers?.length > 0 && (
                  <div>NS: {scan.whois_nameservers.join(', ')}</div>
                )}
              </Section>
            )}

            {/* TXT Records */}
            {scan.dns_txt_records && scan.dns_txt_records.length > 0 && (
              <Section title="TXT Records">
                {scan.dns_txt_records.map((txt, i) => (
                  <div key={i} className="font-mono text-[10px] break-all">{txt}</div>
                ))}
              </Section>
            )}

            {/* Scan timestamps */}
            <div className="text-muted-foreground pt-1 border-t">
              {scan.last_dns_scan_at && (
                <span>DNS: {new Date(scan.last_dns_scan_at).toLocaleString('it-IT')} </span>
              )}
              {scan.last_cms_scan_at && (
                <span>• CMS: {new Date(scan.last_cms_scan_at).toLocaleString('it-IT')} </span>
              )}
              {scan.last_whois_scan_at && (
                <span>• WHOIS: {new Date(scan.last_whois_scan_at).toLocaleString('it-IT')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-medium text-muted-foreground mb-1">{title}</div>
      <div className="space-y-0.5 pl-2">{children}</div>
    </div>
  );
}

function RecordRow({ type, value }: { type: string; value: string }) {
  return (
    <div className="flex gap-2 font-mono">
      <Badge variant="outline" className="text-[9px] h-4 px-1 min-w-[30px] justify-center">{type}</Badge>
      <span className="truncate">{value}</span>
    </div>
  );
}
