'use client';

import { useState, useEffect } from 'react';
import { ScanDetail } from './scan-detail';
import type { ExternalScanResult } from '@/types/database';
import { Loader2 } from 'lucide-react';

interface SiteScanRowProps {
  domain: string;
}

export function SiteScanRow({ domain }: SiteScanRowProps) {
  const [scan, setScan] = useState<ExternalScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);

  useEffect(() => {
    async function fetchScan() {
      try {
        const res = await fetch(`/api/scanner/${encodeURIComponent(domain)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok) setScan(data.result);
        }
      } catch {
        // No scan data yet
      } finally {
        setLoading(false);
      }
    }
    fetchScan();
  }, [domain]);

  const handleRescan = async () => {
    setRescanning(true);
    try {
      const res = await fetch(`/api/scanner/${encodeURIComponent(domain)}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) setScan(data.result);
      }
    } catch {
      // Rescan failed
    } finally {
      setRescanning(false);
    }
  };

  if (loading) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  if (!scan) return null;

  return (
    <ScanDetail
      scan={scan}
      onRescan={handleRescan}
      isRescanning={rescanning}
    />
  );
}
