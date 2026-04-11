'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, ExternalLink, CheckCircle2, Building2, Tag, X, Key, Calendar, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import type { Client, DomainLifecycleStatus, RedirectType } from '@/types';
import { PREDEFINED_TAGS, getTagConfig } from '@/lib/constants/tags';
import { ServerSelect } from '@/components/servers/server-select';
import { LifecycleStatusSelect } from '@/components/sites/lifecycle-status-select';
import { RedirectConfig } from '@/components/sites/redirect-config';

const siteFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  url: z.string().url('URL non valido'),
  platform: z.enum(['wordpress', 'prestashop', 'nextjs', 'other']),
  client_id: z.string().optional(),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  ssl_check_enabled: z.boolean(),
  uptime_check_enabled: z.boolean(),
  performance_check_enabled: z.boolean(),
  updates_check_enabled: z.boolean(),
  ecommerce_check_enabled: z.boolean(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  // Domain management fields
  server_id: z.string().optional().nullable(),
  lifecycle_status: z.enum([
    'active', 'to_update', 'to_rebuild', 'in_maintenance',
    'in_progress', 'to_delete', 'redirect_only', 'archived'
  ]).optional(),
  redirect_to_site_id: z.string().optional().nullable(),
  redirect_type: z.enum(['301', '302', '307', '308', 'meta', 'js']).optional().nullable(),
  is_redirect_source: z.boolean().optional(),
  domain_expires_at: z.string().optional().nullable(),
  domain_registrar: z.string().optional().nullable(),
  domain_notes: z.string().optional().nullable(),
});

type SiteFormValues = z.infer<typeof siteFormSchema>;

interface SiteFormProps {
  initialData?: Partial<SiteFormValues & {
    client_id?: string | null;
    tags?: string[];
    hasApiKey?: boolean;
    hasApiSecret?: boolean;
    server_id?: string | null;
    lifecycle_status?: DomainLifecycleStatus;
    redirect_to_site_id?: string | null;
    redirect_type?: RedirectType | null;
    is_redirect_source?: boolean;
    domain_expires_at?: string | null;
    domain_registrar?: string | null;
    domain_notes?: string | null;
  }>;
  siteId?: string;
}

export function SiteForm({ initialData, siteId }: SiteFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const isEditing = !!siteId;

  // Get client_id from URL params (for creating from client detail page)
  const urlClientId = searchParams.get('client_id');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients?is_active=true');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      url: initialData?.url || '',
      platform: initialData?.platform || 'wordpress',
      client_id: initialData?.client_id || urlClientId || '',
      api_key: '',
      api_secret: '',
      ssl_check_enabled: initialData?.ssl_check_enabled ?? true,
      uptime_check_enabled: initialData?.uptime_check_enabled ?? true,
      performance_check_enabled: initialData?.performance_check_enabled ?? true,
      updates_check_enabled: initialData?.updates_check_enabled ?? true,
      ecommerce_check_enabled: initialData?.ecommerce_check_enabled ?? false,
      tags: initialData?.tags || [],
      notes: initialData?.notes || '',
      // Domain management fields
      server_id: initialData?.server_id || null,
      lifecycle_status: initialData?.lifecycle_status || 'active',
      redirect_to_site_id: initialData?.redirect_to_site_id || null,
      redirect_type: initialData?.redirect_type || null,
      is_redirect_source: initialData?.is_redirect_source ?? false,
      domain_expires_at: initialData?.domain_expires_at || null,
      domain_registrar: initialData?.domain_registrar || null,
      domain_notes: initialData?.domain_notes || null,
    },
  });

  async function onSubmit(values: SiteFormValues) {
    setIsLoading(true);

    // Convert empty client_id to null
    const payload = {
      ...values,
      client_id: values.client_id || null,
    };

    try {
      const response = await fetch(
        siteId ? `/api/sites/${siteId}` : '/api/sites',
        {
          method: siteId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante il salvataggio');
      }

      toast.success(isEditing ? 'Sito aggiornato' : 'Sito creato con successo');
      router.push('/sites');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Errore durante il salvataggio'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
            <span className="text-sm font-semibold">Informazioni Base</span>
          </div>
          <div className="p-4 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Il mio sito web" className="h-9 sm:h-10" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://esempio.com" className="h-9 sm:h-10" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Piattaforma</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue placeholder="Seleziona piattaforma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="wordpress">WordPress</SelectItem>
                      <SelectItem value="prestashop">PrestaShop</SelectItem>
                      <SelectItem value="nextjs">Next.js</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Cliente</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue placeholder="Seleziona cliente (opzionale)">
                          {field.value && field.value !== 'none' ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {clients.find(c => c.id === field.value)?.name || 'Cliente'}
                            </div>
                          ) : (
                            'Nessun cliente'
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nessun cliente</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {client.name}
                            {client.company_name && (
                              <span className="text-muted-foreground">
                                ({client.company_name})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Associa questo sito a un cliente per una gestione organizzata
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Tag</FormLabel>
                  <FormDescription className="text-xs mb-2">
                    Seleziona uno o piu tag per categorizzare il sito
                  </FormDescription>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TAGS.map((tag) => {
                      const isSelected = field.value?.includes(tag.value);
                      const config = getTagConfig(tag.value);
                      return (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => {
                            const currentTags = field.value || [];
                            if (isSelected) {
                              field.onChange(currentTags.filter(t => t !== tag.value));
                            } else {
                              field.onChange([...currentTags, tag.value]);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                            isSelected
                              ? `${config.bgColor} ${config.color} ${config.borderColor} ring-2 ring-offset-1 ring-primary/30`
                              : 'bg-background hover:bg-muted border-input'
                          }`}
                        >
                          <Tag className="h-3 w-3" />
                          {tag.label}
                          {isSelected && <X className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                  {field.value && field.value.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Tag selezionati: {field.value.length}
                    </div>
                  )}
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note aggiuntive..."
                      className="resize-none text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
            <span className="text-sm font-semibold">Plugin Webmaster Monitor</span>
            <p className="text-xs text-zinc-500 mt-0.5">Per monitorare informazioni server, plugin e aggiornamenti</p>
          </div>
          <div className="p-4 space-y-4">
            {form.watch('platform') === 'wordpress' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  <span className="font-medium">Per WordPress:</span> Installa il nostro plugin gratuito per abilitare il monitoraggio avanzato.{' '}
                  <Link href="/plugin" className="text-primary hover:underline inline-flex items-center gap-1">
                    Scarica plugin <ExternalLink className="h-3 w-3" />
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch('platform') === 'wordpress' ? 'API Key (dal plugin)' : 'API Key'}
                  </FormLabel>
                  {isEditing && initialData?.hasApiKey && !field.value && (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-md border border-green-200 dark:border-green-800">
                      <Key className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>API Key gia configurata - lascia vuoto per mantenerla oppure inserisci una nuova chiave per sostituirla</span>
                    </div>
                  )}
                  <FormControl>
                    <Input
                      placeholder={
                        isEditing && initialData?.hasApiKey
                          ? 'Lascia vuoto per mantenere l\'API attuale...'
                          : form.watch('platform') === 'wordpress'
                          ? 'wm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                          : 'Inserisci API key...'
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {form.watch('platform') === 'wordpress'
                      ? 'Trovi l\'API Key in WordPress > Impostazioni > Webmaster Monitor'
                      : form.watch('platform') === 'prestashop'
                      ? 'Web Service Key dal backoffice PrestaShop'
                      : 'Chiave API per accesso ai dati del sito'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('platform') !== 'wordpress' && (
              <FormField
                control={form.control}
                name="api_secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Secret (opzionale)</FormLabel>
                    {isEditing && initialData?.hasApiSecret && !field.value && (
                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-md border border-green-200 dark:border-green-800">
                        <Key className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>API Secret gia configurato - lascia vuoto per mantenerlo</span>
                      </div>
                    )}
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={
                          isEditing && initialData?.hasApiSecret
                            ? 'Lascia vuoto per mantenere il secret attuale...'
                            : 'Inserisci API secret...'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch('api_key') && form.watch('platform') === 'wordpress' && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>API Key inserita - la connessione sara verificata al salvataggio</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
            <span className="text-sm font-semibold">Monitoraggio</span>
          </div>
          <div className="p-4 space-y-3">
            <FormField
              control={form.control}
              name="uptime_check_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 sm:p-4 gap-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm sm:text-base">Uptime</FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Controlla se il sito e' online ogni 5 minuti
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ssl_check_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 sm:p-4 gap-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm sm:text-base">Certificato SSL</FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Monitora validita' e scadenza del certificato
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="performance_check_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 sm:p-4 gap-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm sm:text-base">Performance</FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Analizza Core Web Vitals e velocita'
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="updates_check_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 sm:p-4 gap-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm sm:text-base">Aggiornamenti</FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Controlla aggiornamenti disponibili (richiede API key)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ecommerce_check_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 sm:p-4 gap-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm sm:text-base">E-commerce</FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Monitora ordini e transazioni (solo WooCommerce/PrestaShop)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-white/5 rounded-lg">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-white/5">
            <span className="text-sm font-semibold">Gestione Dominio</span>
            <p className="text-xs text-zinc-500 mt-0.5">Server, stato del ciclo di vita e informazioni dominio</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="server_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Server</FormLabel>
                    <FormControl>
                      <ServerSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Server dove e ospitato il sito
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lifecycle_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Stato Ciclo di Vita</FormLabel>
                    <FormControl>
                      <LifecycleStatusSelect
                        value={field.value || 'active'}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Stato attuale del dominio/sito
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <RedirectConfig
              isRedirectSource={form.watch('is_redirect_source') || false}
              redirectToSiteId={form.watch('redirect_to_site_id') || null}
              redirectType={form.watch('redirect_type') || null}
              currentSiteId={siteId}
              onIsRedirectSourceChange={(value) => form.setValue('is_redirect_source', value)}
              onRedirectToSiteIdChange={(value) => form.setValue('redirect_to_site_id', value)}
              onRedirectTypeChange={(value) => form.setValue('redirect_type', value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="domain_expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Scadenza Dominio</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          className="h-9 sm:h-10 pl-10"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? new Date(value).toISOString() : null);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Data di scadenza della registrazione
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domain_registrar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Registrar</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Aruba, Register.it, GoDaddy..."
                        className="h-9 sm:h-10"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Dove e registrato il dominio
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="domain_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Note Dominio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note sulla registrazione dominio, DNS, ecc..."
                      className="resize-none text-sm"
                      rows={2}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isLoading}
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {isEditing ? 'Salva modifiche' : 'Crea sito'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            Annulla
          </Button>
        </div>
      </form>
    </Form>
  );
}
