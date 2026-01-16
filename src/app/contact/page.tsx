'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Server,
  Mail,
  MessageSquare,
  Headphones,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simula invio email (in produzione collegare a un servizio email)
    try {
      // Qui puoi integrare con un servizio come Resend, SendGrid, etc.
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSubmitted(true);
      toast.success('Messaggio inviato con successo!');
    } catch (error) {
      toast.error('Errore nell\'invio del messaggio. Riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Generale',
      value: 'info@webmaster-monitor.com',
      href: 'mailto:info@webmaster-monitor.com',
    },
    {
      icon: Headphones,
      title: 'Supporto Tecnico',
      value: 'support@webmaster-monitor.com',
      href: 'mailto:support@webmaster-monitor.com',
    },
    {
      icon: MessageSquare,
      title: 'Vendite',
      value: 'sales@webmaster-monitor.com',
      href: 'mailto:sales@webmaster-monitor.com',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Server className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight">Webmaster</span>
              <span className="text-[10px] text-muted-foreground leading-tight -mt-0.5">MONITOR</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Contattaci</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hai domande sulla piattaforma? Vuoi saperne di piu sui nostri piani?
            Siamo qui per aiutarti.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informazioni di Contatto</CardTitle>
                <CardDescription>
                  Scegli il canale piu adatto alle tue esigenze
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactInfo.map((info) => (
                  <a
                    key={info.title}
                    href={info.href}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <info.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{info.title}</p>
                      <p className="text-sm text-primary">{info.value}</p>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Orari di Supporto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lunedi - Venerdi</span>
                    <span className="font-medium">9:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sabato</span>
                    <span className="font-medium">9:00 - 13:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domenica</span>
                    <span className="font-medium">Chiuso</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Fuso orario: CET (Roma)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Emergenze Tecniche</h3>
                <p className="text-sm opacity-90 mb-4">
                  Per problemi critici fuori orario, i clienti Pro e Agency
                  possono contattare il supporto prioritario.
                </p>
                <a
                  href="mailto:urgent@webmaster-monitor.com"
                  className="text-sm font-medium underline"
                >
                  urgent@webmaster-monitor.com
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Invia un Messaggio</CardTitle>
                <CardDescription>
                  Compila il form e ti risponderemo entro 24 ore lavorative
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Messaggio Inviato!</h3>
                    <p className="text-muted-foreground mb-6">
                      Grazie per averci contattato. Ti risponderemo il prima possibile.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                    >
                      Invia un altro messaggio
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome e Cognome *</Label>
                        <Input
                          id="name"
                          placeholder="Mario Rossi"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="mario@esempio.com"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Argomento *</Label>
                      <Select
                        required
                        value={formData.subject}
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un argomento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Informazioni Generali</SelectItem>
                          <SelectItem value="pricing">Prezzi e Piani</SelectItem>
                          <SelectItem value="demo">Richiesta Demo</SelectItem>
                          <SelectItem value="support">Supporto Tecnico</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                          <SelectItem value="other">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Messaggio *</Label>
                      <Textarea
                        id="message"
                        placeholder="Scrivi il tuo messaggio..."
                        rows={6}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" id="privacy" required className="mt-1" />
                      <label htmlFor="privacy">
                        Ho letto e accetto la{' '}
                        <Link href="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>{' '}
                        e acconsento al trattamento dei miei dati personali. *
                      </label>
                    </div>

                    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Invia Messaggio
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Domande Frequenti</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Come posso iniziare a usare la piattaforma?</h3>
                <p className="text-sm text-muted-foreground">
                  Registrati gratuitamente, aggiungi il tuo primo sito e inizia a monitorarlo
                  immediatamente. Per WordPress, installa il nostro plugin per funzionalita avanzate.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Offrite un periodo di prova?</h3>
                <p className="text-sm text-muted-foreground">
                  Si, tutti i piani includono una prova gratuita di 14 giorni con accesso
                  completo a tutte le funzionalita. Non e richiesta carta di credito.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Posso cambiare piano in qualsiasi momento?</h3>
                <p className="text-sm text-muted-foreground">
                  Certamente! Puoi fare upgrade o downgrade del tuo piano in qualsiasi momento
                  dalle impostazioni del tuo account. Le modifiche sono immediate.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Come funziona il supporto?</h3>
                <p className="text-sm text-muted-foreground">
                  Offriamo supporto via email per tutti i piani. I piani Pro e Agency includono
                  supporto prioritario con tempi di risposta garantiti.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Webmaster Monitor. Tutti i diritti riservati.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Termini</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookie</Link>
            <Link href="/gdpr" className="hover:text-foreground">GDPR</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
