'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface BillingInfo {
  companyName: string;
  vatNumber: string;       // P.IVA
  codiceFiscale: string;   // Codice Fiscale
  codiceSdi: string;       // Codice SDI (7 chars)
  pec: string;             // PEC email
  phone: string;
}

export function BillingInfoForm() {
  const [info, setInfo] = useState<BillingInfo>({
    companyName: '',
    vatNumber: '',
    codiceFiscale: '',
    codiceSdi: '',
    pec: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing/info')
      .then(res => res.json())
      .then(data => {
        if (data.info) setInfo(data.info);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/billing/info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });
      if (res.ok) {
        toast.success('Dati di fatturazione aggiornati');
      } else {
        toast.error('Errore nel salvataggio');
      }
    } catch {
      toast.error('Errore di connessione');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="animate-pulse h-48 bg-zinc-100 dark:bg-white/5 rounded-lg" />;

  return (
    <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
        <h3 className="text-sm font-semibold">Dati di fatturazione</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Compilazione facoltativa per la fatturazione elettronica italiana</p>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Ragione Sociale</label>
          <Input className="mt-1 h-9 text-sm" value={info.companyName} onChange={e => setInfo({...info, companyName: e.target.value})} placeholder="Nome azienda" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">P.IVA</label>
          <Input className="mt-1 h-9 text-sm" value={info.vatNumber} onChange={e => setInfo({...info, vatNumber: e.target.value})} placeholder="IT12345678901" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Codice Fiscale</label>
          <Input className="mt-1 h-9 text-sm" value={info.codiceFiscale} onChange={e => setInfo({...info, codiceFiscale: e.target.value})} placeholder="RSSMRA80A01H501U" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Codice SDI</label>
          <Input className="mt-1 h-9 text-sm" value={info.codiceSdi} onChange={e => setInfo({...info, codiceSdi: e.target.value})} placeholder="0000000" maxLength={7} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">PEC</label>
          <Input className="mt-1 h-9 text-sm" type="email" value={info.pec} onChange={e => setInfo({...info, pec: e.target.value})} placeholder="fatture@pec.azienda.it" />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Telefono</label>
          <Input className="mt-1 h-9 text-sm" value={info.phone} onChange={e => setInfo({...info, phone: e.target.value})} placeholder="+39 02 1234567" />
        </div>
      </div>
      <div className="px-4 py-3 border-t border-zinc-200 dark:border-white/5 flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          {saving ? 'Salvataggio...' : 'Salva dati fatturazione'}
        </Button>
      </div>
    </div>
  );
}
