import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Server, Shield, Download, Trash2, Edit, Eye, Ban, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'GDPR - Webmaster Monitor',
  description: 'Informativa GDPR e diritti degli interessati per Webmaster Monitor',
};

export default function GdprPage() {
  const rights = [
    {
      icon: Eye,
      title: 'Diritto di Accesso',
      description: 'Hai il diritto di ottenere conferma dell\'esistenza di dati che ti riguardano e di riceverne una copia.',
      article: 'Art. 15 GDPR',
    },
    {
      icon: Edit,
      title: 'Diritto di Rettifica',
      description: 'Puoi richiedere la correzione di dati personali inesatti o l\'integrazione di dati incompleti.',
      article: 'Art. 16 GDPR',
    },
    {
      icon: Trash2,
      title: 'Diritto alla Cancellazione',
      description: 'Puoi richiedere l\'eliminazione dei tuoi dati personali ("diritto all\'oblio").',
      article: 'Art. 17 GDPR',
    },
    {
      icon: Ban,
      title: 'Diritto di Limitazione',
      description: 'Puoi richiedere la limitazione del trattamento dei tuoi dati in determinate circostanze.',
      article: 'Art. 18 GDPR',
    },
    {
      icon: Download,
      title: 'Diritto alla Portabilita',
      description: 'Hai il diritto di ricevere i tuoi dati in un formato strutturato e di trasferirli ad altro titolare.',
      article: 'Art. 20 GDPR',
    },
    {
      icon: FileText,
      title: 'Diritto di Opposizione',
      description: 'Puoi opporti al trattamento dei tuoi dati per motivi legittimi, incluso il marketing diretto.',
      article: 'Art. 21 GDPR',
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
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Conformita GDPR</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Informativa sul Regolamento Generale sulla Protezione dei Dati (UE 2016/679)
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Il Nostro Impegno per la Privacy</h2>
            <p className="text-muted-foreground mb-4">
              Webmaster Monitor si impegna a proteggere i tuoi dati personali in conformita
              con il Regolamento Generale sulla Protezione dei Dati (GDPR). Questa pagina
              ti fornisce informazioni chiare sui tuoi diritti e su come li puoi esercitare.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">I Tuoi Diritti</h2>
            <p className="text-muted-foreground mb-6">
              Il GDPR ti garantisce i seguenti diritti riguardo ai tuoi dati personali:
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {rights.map((right) => (
                <Card key={right.title}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <right.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{right.title}</CardTitle>
                        <span className="text-xs text-muted-foreground">{right.article}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{right.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Come Esercitare i Tuoi Diritti</h2>
            <p className="text-muted-foreground mb-4">
              Puoi esercitare i tuoi diritti in diversi modi:
            </p>

            <Card className="mb-4">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">1. Direttamente dalla Piattaforma</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li><strong>Accesso e modifica dati:</strong> Impostazioni &gt; Profilo</li>
                  <li><strong>Download dei dati:</strong> Impostazioni &gt; Privacy &gt; Esporta dati</li>
                  <li><strong>Cancellazione account:</strong> Impostazioni &gt; Account &gt; Elimina account</li>
                  <li><strong>Gestione consensi:</strong> Impostazioni &gt; Privacy &gt; Preferenze</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">2. Contattandoci Direttamente</h3>
                <p className="text-muted-foreground mb-4">
                  Per richieste che non puoi gestire autonomamente, contattaci a:
                </p>
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-medium">Data Protection Officer (DPO)</p>
                  <p className="text-muted-foreground">
                    Email: <a href="mailto:dpo@webmaster-monitor.com" className="text-primary hover:underline">dpo@webmaster-monitor.com</a>
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Risponderemo entro 30 giorni dalla ricezione della richiesta,
                  come previsto dal GDPR.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Basi Giuridiche del Trattamento</h2>
            <p className="text-muted-foreground mb-4">
              Trattiamo i tuoi dati sulla base delle seguenti basi giuridiche:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 border-b">Finalita</th>
                    <th className="text-left p-3 border-b">Base Giuridica</th>
                    <th className="text-left p-3 border-b">Art. GDPR</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="p-3">Fornitura del servizio</td>
                    <td className="p-3">Esecuzione del contratto</td>
                    <td className="p-3">Art. 6(1)(b)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Gestione account</td>
                    <td className="p-3">Esecuzione del contratto</td>
                    <td className="p-3">Art. 6(1)(b)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Invio notifiche di servizio</td>
                    <td className="p-3">Esecuzione del contratto</td>
                    <td className="p-3">Art. 6(1)(b)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Marketing diretto</td>
                    <td className="p-3">Consenso</td>
                    <td className="p-3">Art. 6(1)(a)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Sicurezza e prevenzione frodi</td>
                    <td className="p-3">Legittimo interesse</td>
                    <td className="p-3">Art. 6(1)(f)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Miglioramento del servizio</td>
                    <td className="p-3">Legittimo interesse</td>
                    <td className="p-3">Art. 6(1)(f)</td>
                  </tr>
                  <tr>
                    <td className="p-3">Adempimenti fiscali</td>
                    <td className="p-3">Obbligo legale</td>
                    <td className="p-3">Art. 6(1)(c)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Trasferimento Dati Extra-UE</h2>
            <p className="text-muted-foreground mb-4">
              Alcuni dei nostri fornitori di servizi sono situati al di fuori dell'Unione Europea.
              Per garantire un livello adeguato di protezione, utilizziamo:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Clausole Contrattuali Standard (SCC) approvate dalla Commissione Europea</li>
              <li>Fornitori certificati secondo il Data Privacy Framework UE-USA</li>
              <li>Valutazioni di impatto sul trasferimento (TIA) quando necessario</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Misure di Sicurezza</h2>
            <p className="text-muted-foreground mb-4">
              Implementiamo misure tecniche e organizzative appropriate per proteggere i tuoi dati:
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Misure Tecniche</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Crittografia TLS/SSL in transito</li>
                    <li>Crittografia dati a riposo</li>
                    <li>Hashing password con bcrypt</li>
                    <li>Firewall e protezione DDoS</li>
                    <li>Backup automatici cifrati</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Misure Organizzative</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Accesso dati su base need-to-know</li>
                    <li>Formazione del personale</li>
                    <li>Policy di sicurezza interne</li>
                    <li>Audit periodici</li>
                    <li>Procedure di incident response</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Data Breach</h2>
            <p className="text-muted-foreground mb-4">
              In caso di violazione dei dati personali, seguiamo le procedure previste dal GDPR:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Notifica all'Autorita Garante entro 72 ore (se necessario)</li>
              <li>Comunicazione agli interessati in caso di rischio elevato</li>
              <li>Documentazione dell'incidente e delle misure adottate</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Reclami</h2>
            <p className="text-muted-foreground mb-4">
              Se ritieni che il trattamento dei tuoi dati violi il GDPR, hai il diritto di:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Contattarci per risolvere la questione direttamente</li>
              <li>Presentare reclamo all'Autorita Garante per la Protezione dei Dati Personali</li>
            </ul>
            <div className="bg-muted rounded-lg p-4 mt-4">
              <p className="font-medium">Garante per la Protezione dei Dati Personali</p>
              <p className="text-sm text-muted-foreground">
                Piazza Venezia 11, 00187 Roma<br />
                Tel: (+39) 06.696771<br />
                Email: protocollo@gpdp.it<br />
                Sito: <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.garanteprivacy.it</a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Documenti Correlati</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/privacy">
                <Button variant="outline" size="sm">Privacy Policy</Button>
              </Link>
              <Link href="/terms">
                <Button variant="outline" size="sm">Termini di Servizio</Button>
              </Link>
              <Link href="/cookies">
                <Button variant="outline" size="sm">Cookie Policy</Button>
              </Link>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Contatti</h2>
            <p className="text-muted-foreground">
              Per qualsiasi domanda relativa al GDPR o alla protezione dei dati, contattaci:
            </p>
            <div className="bg-muted rounded-lg p-4 mt-4">
              <p className="text-muted-foreground">
                <strong>Email DPO:</strong>{' '}
                <a href="mailto:dpo@webmaster-monitor.com" className="text-primary hover:underline">dpo@webmaster-monitor.com</a>
              </p>
              <p className="text-muted-foreground">
                <strong>Email Privacy:</strong>{' '}
                <a href="mailto:privacy@webmaster-monitor.com" className="text-primary hover:underline">privacy@webmaster-monitor.com</a>
              </p>
            </div>
          </section>
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
