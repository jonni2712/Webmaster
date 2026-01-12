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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info, ExternalLink, CheckCircle2, Building2 } from 'lucide-react';
import Link from 'next/link';
import type { Client } from '@/types';

const siteFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  url: z.string().url('URL non valido'),
  platform: z.enum(['wordpress', 'prestashop', 'other']),
  client_id: z.string().optional(),
  api_key: z.string().optional(),
  api_secret: z.string().optional(),
  ssl_check_enabled: z.boolean(),
  uptime_check_enabled: z.boolean(),
  performance_check_enabled: z.boolean(),
  updates_check_enabled: z.boolean(),
  ecommerce_check_enabled: z.boolean(),
  notes: z.string().optional(),
});

type SiteFormValues = z.infer<typeof siteFormSchema>;

interface SiteFormProps {
  initialData?: Partial<SiteFormValues & { client_id?: string | null }>;
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
      notes: initialData?.notes || '',
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
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Informazioni Base</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Plugin Webmaster Monitor</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Per monitorare informazioni server, plugin e aggiornamenti
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
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
                  <FormControl>
                    <Input
                      placeholder={
                        form.watch('platform') === 'wordpress'
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
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Inserisci API secret..."
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Monitoraggio</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-3 sm:space-y-4">
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
          </CardContent>
        </Card>

        <div className="flex gap-2 sm:gap-4">
          <Button type="submit" disabled={isLoading} size="sm" className="sm:size-default">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salva modifiche' : 'Crea sito'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="sm:size-default"
            onClick={() => router.back()}
          >
            Annulla
          </Button>
        </div>
      </form>
    </Form>
  );
}
