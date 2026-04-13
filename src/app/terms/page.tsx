import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Server } from 'lucide-react';

export const metadata = {
  title: 'Termini di Servizio - Webmaster Monitor',
  description: 'Termini e condizioni di utilizzo di Webmaster Monitor',
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-2">Termini di Servizio</h1>
        <p className="text-muted-foreground mb-8">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Accettazione dei Termini</h2>
            <p className="text-muted-foreground mb-4">
              Utilizzando Webmaster Monitor, accetti di essere vincolato dai presenti Termini di Servizio.
              Se non accetti questi termini, non puoi utilizzare il servizio.
            </p>
            <p className="text-muted-foreground">
              Ci riserviamo il diritto di modificare questi termini in qualsiasi momento.
              Le modifiche saranno efficaci dalla data di pubblicazione. L'uso continuato del
              servizio dopo le modifiche costituisce accettazione dei nuovi termini.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Descrizione del Servizio</h2>
            <p className="text-muted-foreground mb-4">
              Webmaster Monitor e una piattaforma SaaS che fornisce:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Monitoraggio uptime e disponibilita dei siti web</li>
              <li>Controllo validita e scadenza certificati SSL</li>
              <li>Analisi delle performance e Core Web Vitals</li>
              <li>Gestione aggiornamenti per WordPress</li>
              <li>Sistema di notifiche multi-canale</li>
              <li>Dashboard e report analitici</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Registrazione e Account</h2>
            <p className="text-muted-foreground mb-4">Per utilizzare il servizio devi:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Avere almeno 18 anni o l'eta legale nel tuo paese</li>
              <li>Fornire informazioni accurate e complete durante la registrazione</li>
              <li>Mantenere la sicurezza delle tue credenziali di accesso</li>
              <li>Notificarci immediatamente di qualsiasi uso non autorizzato</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Sei responsabile di tutte le attivita che avvengono sotto il tuo account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Piani e Pagamenti</h2>
            <p className="text-muted-foreground mb-4">
              Il servizio e disponibile in diversi piani tariffari. Accettando un piano a pagamento:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Autorizzi l'addebito ricorrente secondo la frequenza scelta</li>
              <li>Comprendi che i prezzi possono variare con preavviso di 30 giorni</li>
              <li>Accetti che il mancato pagamento puo comportare la sospensione del servizio</li>
              <li>Riconosci che i rimborsi sono a nostra discrezione</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Uso Accettabile</h2>
            <p className="text-muted-foreground mb-4">Ti impegni a non:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Utilizzare il servizio per attivita illegali</li>
              <li>Monitorare siti senza autorizzazione del proprietario</li>
              <li>Tentare di aggirare le limitazioni del piano</li>
              <li>Condividere le credenziali di accesso con terzi</li>
              <li>Effettuare reverse engineering del servizio</li>
              <li>Sovraccaricare intenzionalmente i nostri sistemi</li>
              <li>Utilizzare il servizio per inviare spam o contenuti dannosi</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Proprieta Intellettuale</h2>
            <p className="text-muted-foreground mb-4">
              Tutti i diritti di proprieta intellettuale relativi al servizio (software, design,
              marchi, contenuti) appartengono a Webmaster Monitor o ai suoi licenzianti.
            </p>
            <p className="text-muted-foreground">
              Ti concediamo una licenza limitata, non esclusiva e non trasferibile per utilizzare
              il servizio secondo questi termini. Questa licenza non include il diritto di:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
              <li>Modificare o creare opere derivate</li>
              <li>Rivendere o sublicenziare il servizio</li>
              <li>Utilizzare i nostri marchi senza autorizzazione</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Dati e Privacy</h2>
            <p className="text-muted-foreground mb-4">
              Il trattamento dei dati personali e regolato dalla nostra
              <Link href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</Link>.
            </p>
            <p className="text-muted-foreground">
              Mantieni la proprieta dei tuoi dati. Ci concedi una licenza per elaborarli
              al fine di fornirti il servizio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Disponibilita del Servizio</h2>
            <p className="text-muted-foreground mb-4">
              Ci impegniamo a mantenere il servizio disponibile, tuttavia:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Non garantiamo un uptime del 100%</li>
              <li>Potremmo effettuare manutenzioni programmate</li>
              <li>Eventi di forza maggiore possono causare interruzioni</li>
              <li>Le funzionalita possono essere modificate nel tempo</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Limitazione di Responsabilita</h2>
            <p className="text-muted-foreground mb-4">
              Nei limiti consentiti dalla legge:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Il servizio e fornito "cosi com'e" senza garanzie</li>
              <li>Non siamo responsabili per danni indiretti, incidentali o consequenziali</li>
              <li>La nostra responsabilita massima e limitata all'importo pagato negli ultimi 12 mesi</li>
              <li>Non siamo responsabili per problemi causati da terze parti</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Indennizzo</h2>
            <p className="text-muted-foreground">
              Accetti di indennizzare e manlevare Webmaster Monitor da qualsiasi reclamo,
              danno, perdita o spesa (incluse le spese legali) derivanti dal tuo utilizzo
              del servizio o dalla violazione di questi termini.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Risoluzione</h2>
            <p className="text-muted-foreground mb-4">
              Puoi cancellare il tuo account in qualsiasi momento dalle impostazioni.
            </p>
            <p className="text-muted-foreground">
              Possiamo sospendere o terminare il tuo account se:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-4">
              <li>Violi questi termini</li>
              <li>Non paghi le quote dovute</li>
              <li>Il tuo utilizzo danneggia altri utenti o il servizio</li>
              <li>Siamo obbligati dalla legge</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Legge Applicabile</h2>
            <p className="text-muted-foreground">
              Questi termini sono regolati dalla legge italiana. Per qualsiasi controversia
              sara competente il Foro di Milano, salvo diversa disposizione inderogabile di legge.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Disposizioni Generali</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Se una clausola e ritenuta invalida, le altre rimangono in vigore</li>
              <li>Il mancato esercizio di un diritto non costituisce rinuncia</li>
              <li>Questi termini costituiscono l'intero accordo tra le parti</li>
              <li>Non puoi cedere i tuoi diritti senza il nostro consenso</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">14. Abbonamenti e Pagamenti</h2>
            <p className="text-muted-foreground mb-4">
              I piani a pagamento (Pro, Business, Agency) prevedono un periodo di prova gratuito
              di 14 giorni. Al termine del periodo di prova, l'abbonamento si rinnova
              automaticamente al prezzo del piano selezionato.
            </p>
            <p className="text-muted-foreground mb-4">
              Puoi cancellare l'abbonamento in qualsiasi momento dalla sezione Impostazioni &gt;
              Abbonamento. La cancellazione ha effetto alla fine del periodo di fatturazione corrente.
            </p>
            <p className="text-muted-foreground mb-4">
              In caso di mancato pagamento, l'account verra' declassato al piano Starter gratuito
              dopo 7 giorni di grazia.
            </p>
            <p className="text-muted-foreground">
              I prezzi possono essere modificati con preavviso di 30 giorni via email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">15. Rimborsi</h2>
            <p className="text-muted-foreground">
              Non offriamo rimborsi per periodi parziali. Se cancelli a meta' del mese, hai accesso
              alle funzionalita' del piano fino alla fine del periodo gia' pagato.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">16. Contatti</h2>
            <p className="text-muted-foreground">
              Per domande sui Termini di Servizio, contattaci a:
              <a href="mailto:legal@webmaster-monitor.com" className="text-primary hover:underline ml-1">legal@webmaster-monitor.com</a>
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
