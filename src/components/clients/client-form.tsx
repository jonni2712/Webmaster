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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Building2, User, FileText } from 'lucide-react';

const clientFormSchema = z.object({
  name: z.string().min(1, 'Nome cliente richiesto'),
  company_name: z.string().optional(),
  email: z.string().email('Email non valida').optional().or(z.literal('')),
  phone: z.string().optional(),
  referent_name: z.string().optional(),
  referent_email: z.string().email('Email non valida').optional().or(z.literal('')),
  referent_phone: z.string().optional(),
  address: z.string().optional(),
  vat_number: z.string().optional(),
  fiscal_code: z.string().optional(),
  logo_url: z.string().url('URL non valido').optional().or(z.literal('')),
  notes: z.string().optional(),
  is_active: z.boolean(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: Partial<ClientFormValues>;
  clientId?: string;
}

export function ClientForm({ initialData, clientId }: ClientFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!clientId;

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      company_name: initialData?.company_name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      referent_name: initialData?.referent_name || '',
      referent_email: initialData?.referent_email || '',
      referent_phone: initialData?.referent_phone || '',
      address: initialData?.address || '',
      vat_number: initialData?.vat_number || '',
      fiscal_code: initialData?.fiscal_code || '',
      logo_url: initialData?.logo_url || '',
      notes: initialData?.notes || '',
      is_active: initialData?.is_active ?? true,
    },
  });

  async function onSubmit(values: ClientFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch(
        clientId ? `/api/clients/${clientId}` : '/api/clients',
        {
          method: clientId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante il salvataggio');
      }

      toast.success(isEditing ? 'Cliente aggiornato' : 'Cliente creato con successo');
      router.push('/clients');
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
        {/* Informazioni Base */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base sm:text-lg">Informazioni Aziendali</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Nome Cliente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Mario Rossi" className="h-9 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Ragione Sociale</FormLabel>
                    <FormControl>
                      <Input placeholder="Rossi S.r.l." className="h-9 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="info@azienda.it" className="h-9 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="+39 02 1234567" className="h-9 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Indirizzo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Via Roma 1, 20100 Milano (MI)"
                      className="resize-none text-sm min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="vat_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Partita IVA</FormLabel>
                    <FormControl>
                      <Input placeholder="IT12345678901" className="h-9 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fiscal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Codice Fiscale</FormLabel>
                    <FormControl>
                      <Input placeholder="RSSMRA80A01H501U" className="h-9 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">URL Logo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://esempio.com/logo.png" className="h-9 sm:h-10" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    URL dell'immagine del logo aziendale
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Referente */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base sm:text-lg">Referente</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Persona di riferimento per le comunicazioni
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
            <FormField
              control={form.control}
              name="referent_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Nome Referente</FormLabel>
                  <FormControl>
                    <Input placeholder="Giuseppe Verdi" className="h-9 sm:h-10" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="referent_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Email Referente</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="referente@azienda.it" className="h-9 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referent_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Telefono Referente</FormLabel>
                    <FormControl>
                      <Input placeholder="+39 333 1234567" className="h-9 sm:h-10" {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Note e Stato */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base sm:text-lg">Note e Stato</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Note interne sul cliente..."
                      className="resize-none text-sm min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3 sm:p-4 gap-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm sm:text-base">Cliente Attivo</FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Disattiva per nascondere il cliente dalle liste
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
            {isEditing ? 'Salva modifiche' : 'Crea cliente'}
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
