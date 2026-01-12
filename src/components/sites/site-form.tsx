'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2, Info, ExternalLink, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const siteFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  url: z.string().url('URL non valido'),
  platform: z.enum(['wordpress', 'prestashop', 'other']),
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
  initialData?: Partial<SiteFormValues>;
  siteId?: string;
}

export function SiteForm({ initialData, siteId }: SiteFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!siteId;

  const form = useForm<SiteFormValues>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      url: initialData?.url || '',
      platform: initialData?.platform || 'wordpress',
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

    try {
      const response = await fetch(
        siteId ? `/api/sites/${siteId}` : '/api/sites',
        {
          method: siteId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Il mio sito web" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://esempio.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Piattaforma</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona piattaforma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="wordpress">WordPress</SelectItem>
                      <SelectItem value="prestashop">PrestaShop</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note aggiuntive..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plugin Webmaster Monitor</CardTitle>
            <CardDescription>
              Per monitorare informazioni server, plugin e aggiornamenti
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>API Key inserita - la connessione sara verificata al salvataggio</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monitoraggio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="uptime_check_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Uptime</FormLabel>
                    <FormDescription>
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
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Certificato SSL</FormLabel>
                    <FormDescription>
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
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Performance</FormLabel>
                    <FormDescription>
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
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Aggiornamenti</FormLabel>
                    <FormDescription>
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
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">E-commerce</FormLabel>
                    <FormDescription>
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

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salva modifiche' : 'Crea sito'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annulla
          </Button>
        </div>
      </form>
    </Form>
  );
}
