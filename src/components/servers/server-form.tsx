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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Server } from '@/types/database';

const serverFormSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  provider: z.string().optional(),
  hostname: z.string().optional(),
  notes: z.string().optional(),
  panel_type: z.enum(['cpanel', 'plesk']).nullable().optional(),
  is_active: z.boolean(),
});

type ServerFormValues = z.infer<typeof serverFormSchema>;

interface ServerFormProps {
  initialData?: Partial<Server>;
  serverId?: string;
  onSuccess?: () => void;
}

export function ServerForm({ initialData, serverId, onSuccess }: ServerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!serverId;

  const form = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      provider: initialData?.provider || '',
      hostname: initialData?.hostname || '',
      notes: initialData?.notes || '',
      panel_type: (initialData?.panel_type as 'cpanel' | 'plesk' | undefined) || null,
      is_active: initialData?.is_active ?? true,
    },
  });

  async function onSubmit(values: ServerFormValues) {
    setIsLoading(true);

    // Convert empty strings to null for optional fields
    const payload = {
      ...values,
      provider: values.provider || null,
      hostname: values.hostname || null,
      notes: values.notes || null,
      panel_type: values.panel_type || null,
    };

    try {
      const response = await fetch(
        serverId ? `/api/servers/${serverId}` : '/api/servers',
        {
          method: serverId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore durante il salvataggio');
      }

      toast.success(isEditing ? 'Server aggiornato' : 'Server creato con successo');

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/portfolio/servers');
        router.refresh();
      }
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">
              {isEditing ? 'Modifica Server' : 'Nuovo Server'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Server Principale" className="h-9 sm:h-10" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Nome identificativo per il server
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Provider</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Aruba, OVH, Hetzner..."
                      className="h-9 sm:h-10"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Fornitore di hosting
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hostname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Hostname / IP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="192.168.1.1 o server.example.com"
                      className="h-9 sm:h-10"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Indirizzo IP o hostname del server
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="panel_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Pannello di Controllo</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={(val) => field.onChange(val || null)}
                    >
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue placeholder="Nessun pannello" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpanel">cPanel / WHM</SelectItem>
                        <SelectItem value="plesk">Plesk</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Se il server usa un pannello, puoi installare l&apos;agente per sincronizzare i dati
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
                      placeholder="Note aggiuntive sul server..."
                      className="resize-none text-sm"
                      {...field}
                      value={field.value || ''}
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
                    <FormLabel className="text-sm sm:text-base">Attivo</FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Server disponibile per assegnazione siti
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
            {isEditing ? 'Salva modifiche' : 'Crea server'}
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
