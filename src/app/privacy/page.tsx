import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Server } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - Webmaster Monitor',
  description: 'Informativa sulla privacy di Webmaster Monitor',
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Titolare del Trattamento</h2>
            <p className="text-muted-foreground mb-4">
              Il Titolare del trattamento dei dati personali e Webmaster Monitor, contattabile all'indirizzo email:
              <a href="mailto:privacy@webmaster-monitor.com" className="text-primary hover:underline ml-1">privacy@webmaster-monitor.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Dati Raccolti</h2>
            <p className="text-muted-foreground mb-4">Raccogliamo i seguenti tipi di dati:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Dati di registrazione:</strong> nome, email, password (criptata)</li>
              <li><strong>Dati di autenticazione OAuth:</strong> informazioni fornite da Google o GitHub</li>
              <li><strong>Dati dei siti monitorati:</strong> URL, configurazioni, metriche di performance</li>
              <li><strong>Dati di utilizzo:</strong> log di accesso, azioni eseguite sulla piattaforma</li>
              <li><strong>Dati tecnici:</strong> indirizzo IP, browser, dispositivo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Finalita del Trattamento</h2>
            <p className="text-muted-foreground mb-4">I tuoi dati vengono trattati per:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Fornitura del servizio di monitoraggio siti web</li>
              <li>Gestione dell'account utente</li>
              <li>Invio di notifiche e alert configurati</li>
              <li>Comunicazioni relative al servizio</li>
              <li>Miglioramento della piattaforma</li>
              <li>Adempimento di obblighi legali</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Base Giuridica</h2>
            <p className="text-muted-foreground mb-4">
              Il trattamento dei dati si basa su:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Esecuzione del contratto:</strong> per la fornitura del servizio</li>
              <li><strong>Consenso:</strong> per comunicazioni di marketing (se fornito)</li>
              <li><strong>Legittimo interesse:</strong> per migliorare il servizio e garantire la sicurezza</li>
              <li><strong>Obbligo legale:</strong> per adempiere a normative vigenti</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Conservazione dei Dati</h2>
            <p className="text-muted-foreground mb-4">
              I dati personali vengono conservati per il tempo necessario alle finalita per cui sono stati raccolti:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Dati dell'account: fino alla cancellazione dell'account</li>
              <li>Dati di monitoraggio: secondo il piano sottoscritto (7-365 giorni)</li>
              <li>Log di sistema: 90 giorni</li>
              <li>Dati di fatturazione: 10 anni (obbligo fiscale)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Condivisione dei Dati</h2>
            <p className="text-muted-foreground mb-4">
              I tuoi dati possono essere condivisi con:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Provider di servizi:</strong> hosting (Vercel), database (Supabase), email (Resend)</li>
              <li><strong>Servizi di autenticazione:</strong> Google, GitHub (solo se utilizzi OAuth)</li>
              <li><strong>Autorita competenti:</strong> solo se richiesto dalla legge</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Non vendiamo ne condividiamo i tuoi dati con terze parti per scopi di marketing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Diritti dell'Interessato</h2>
            <p className="text-muted-foreground mb-4">Ai sensi del GDPR, hai diritto a:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Accesso:</strong> ottenere copia dei tuoi dati</li>
              <li><strong>Rettifica:</strong> correggere dati inesatti</li>
              <li><strong>Cancellazione:</strong> richiedere l'eliminazione dei dati</li>
              <li><strong>Limitazione:</strong> limitare il trattamento</li>
              <li><strong>Portabilita:</strong> ricevere i dati in formato strutturato</li>
              <li><strong>Opposizione:</strong> opporti al trattamento</li>
              <li><strong>Revoca del consenso:</strong> ritirare il consenso in qualsiasi momento</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Per esercitare i tuoi diritti, contattaci a:
              <a href="mailto:privacy@webmaster-monitor.com" className="text-primary hover:underline ml-1">privacy@webmaster-monitor.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Sicurezza</h2>
            <p className="text-muted-foreground mb-4">
              Adottiamo misure tecniche e organizzative per proteggere i tuoi dati:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Crittografia dei dati in transito (HTTPS/TLS)</li>
              <li>Crittografia delle password (bcrypt)</li>
              <li>Accesso limitato ai dati su base need-to-know</li>
              <li>Backup regolari e disaster recovery</li>
              <li>Monitoraggio delle attivita sospette</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Trasferimento Dati Extra-UE</h2>
            <p className="text-muted-foreground mb-4">
              Alcuni dei nostri fornitori di servizi potrebbero essere situati al di fuori dell'UE.
              In tal caso, ci assicuriamo che siano presenti adeguate garanzie come le Clausole
              Contrattuali Standard approvate dalla Commissione Europea.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Modifiche alla Privacy Policy</h2>
            <p className="text-muted-foreground mb-4">
              Ci riserviamo il diritto di modificare questa Privacy Policy. Le modifiche saranno
              pubblicate su questa pagina con aggiornamento della data. Per modifiche sostanziali,
              invieremo una notifica via email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Contatti e Reclami</h2>
            <p className="text-muted-foreground mb-4">
              Per domande sulla privacy, contattaci a:
              <a href="mailto:privacy@webmaster-monitor.com" className="text-primary hover:underline ml-1">privacy@webmaster-monitor.com</a>
            </p>
            <p className="text-muted-foreground">
              Hai inoltre il diritto di presentare reclamo all'Autorita Garante per la Protezione
              dei Dati Personali (www.garanteprivacy.it).
            </p>
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
