'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Mail, MessageSquare, Webhook, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const channelTypes = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'telegram', label: 'Telegram', icon: MessageSquare },
  { value: 'slack', label: 'Slack', icon: MessageSquare },
  { value: 'discord', label: 'Discord', icon: MessageSquare },
  { value: 'webhook', label: 'Webhook', icon: Webhook },
] as const;

const baseSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  type: z.enum(['email', 'telegram', 'slack', 'discord', 'webhook']),
});

const emailConfigSchema = z.object({
  recipients: z.array(z.string().email('Email non valida')).min(1, 'Almeno un destinatario'),
});

const telegramConfigSchema = z.object({
  bot_token: z.string().min(1, 'Token bot richiesto'),
  chat_id: z.string().min(1, 'Chat ID richiesto'),
});

const webhookUrlSchema = z.object({
  webhook_url: z.string().url('URL non valido'),
});

const customWebhookSchema = z.object({
  url: z.string().url('URL non valido'),
  method: z.enum(['GET', 'POST', 'PUT']).optional(),
});

interface ChannelFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ChannelForm({ onSuccess, onCancel }: ChannelFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('email');
  const [emailRecipients, setEmailRecipients] = useState<string[]>(['']);

  const form = useForm({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: '',
      type: 'email' as const,
    },
  });

  const addEmailRecipient = () => {
    setEmailRecipients([...emailRecipients, '']);
  };

  const removeEmailRecipient = (index: number) => {
    if (emailRecipients.length > 1) {
      setEmailRecipients(emailRecipients.filter((_, i) => i !== index));
    }
  };

  const updateEmailRecipient = (index: number, value: string) => {
    const updated = [...emailRecipients];
    updated[index] = value;
    setEmailRecipients(updated);
  };

  async function onSubmit(values: z.infer<typeof baseSchema>) {
    setIsLoading(true);

    try {
      let config: Record<string, unknown> = {};

      // Build config based on channel type
      switch (values.type) {
        case 'email':
          const validEmails = emailRecipients.filter(e => e.trim() !== '');
          if (validEmails.length === 0) {
            toast.error('Inserisci almeno un destinatario email');
            setIsLoading(false);
            return;
          }
          config = { recipients: validEmails };
          break;

        case 'telegram':
          const botToken = (document.getElementById('telegram_bot_token') as HTMLInputElement)?.value;
          const chatId = (document.getElementById('telegram_chat_id') as HTMLInputElement)?.value;
          if (!botToken || !chatId) {
            toast.error('Token bot e Chat ID sono richiesti');
            setIsLoading(false);
            return;
          }
          config = { bot_token: botToken, chat_id: chatId };
          break;

        case 'slack':
          const slackUrl = (document.getElementById('slack_webhook_url') as HTMLInputElement)?.value;
          if (!slackUrl) {
            toast.error('Webhook URL richiesto');
            setIsLoading(false);
            return;
          }
          config = { webhook_url: slackUrl };
          break;

        case 'discord':
          const discordUrl = (document.getElementById('discord_webhook_url') as HTMLInputElement)?.value;
          if (!discordUrl) {
            toast.error('Webhook URL richiesto');
            setIsLoading(false);
            return;
          }
          config = { webhook_url: discordUrl };
          break;

        case 'webhook':
          const webhookUrl = (document.getElementById('webhook_url') as HTMLInputElement)?.value;
          if (!webhookUrl) {
            toast.error('URL richiesto');
            setIsLoading(false);
            return;
          }
          config = { url: webhookUrl, method: 'POST' };
          break;
      }

      const response = await fetch('/api/alert-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          type: values.type,
          config,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Errore nella creazione del canale');
      }

      toast.success('Canale creato con successo');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore nella creazione del canale');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome canale</FormLabel>
              <FormControl>
                <Input placeholder="es. Email principale" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedType(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {channelTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dynamic config fields based on type */}
        {selectedType === 'email' && (
          <div className="space-y-3">
            <FormLabel>Destinatari email</FormLabel>
            {emailRecipients.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@esempio.com"
                  value={email}
                  onChange={(e) => updateEmailRecipient(index, e.target.value)}
                />
                {emailRecipients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEmailRecipient(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addEmailRecipient}
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi destinatario
            </Button>
          </div>
        )}

        {selectedType === 'telegram' && (
          <div className="space-y-3">
            <div>
              <FormLabel>Bot Token</FormLabel>
              <Input
                id="telegram_bot_token"
                placeholder="123456:ABC-DEF..."
                className="mt-1"
              />
              <FormDescription className="mt-1">
                Ottieni il token da @BotFather su Telegram
              </FormDescription>
            </div>
            <div>
              <FormLabel>Chat ID</FormLabel>
              <Input
                id="telegram_chat_id"
                placeholder="-1001234567890"
                className="mt-1"
              />
              <FormDescription className="mt-1">
                ID del gruppo o canale Telegram
              </FormDescription>
            </div>
          </div>
        )}

        {selectedType === 'slack' && (
          <div>
            <FormLabel>Webhook URL</FormLabel>
            <Input
              id="slack_webhook_url"
              placeholder="https://hooks.slack.com/services/..."
              className="mt-1"
            />
            <FormDescription className="mt-1">
              Crea un webhook in Slack: Apps {'>'} Incoming Webhooks
            </FormDescription>
          </div>
        )}

        {selectedType === 'discord' && (
          <div>
            <FormLabel>Webhook URL</FormLabel>
            <Input
              id="discord_webhook_url"
              placeholder="https://discord.com/api/webhooks/..."
              className="mt-1"
            />
            <FormDescription className="mt-1">
              Impostazioni canale {'>'} Integrazioni {'>'} Webhook
            </FormDescription>
          </div>
        )}

        {selectedType === 'webhook' && (
          <div>
            <FormLabel>URL Endpoint</FormLabel>
            <Input
              id="webhook_url"
              placeholder="https://esempio.com/webhook"
              className="mt-1"
            />
            <FormDescription className="mt-1">
              Ricevera' una richiesta POST con i dati dell'alert
            </FormDescription>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crea canale
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annulla
          </Button>
        </div>
      </form>
    </Form>
  );
}
