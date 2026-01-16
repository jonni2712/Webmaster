import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Server } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Cookie Policy - Webmaster Monitor',
  description: 'Informativa sui cookie di Webmaster Monitor',
};

export default function CookiesPage() {
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
        <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Cosa Sono i Cookie</h2>
            <p className="text-muted-foreground mb-4">
              I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo
              quando visiti un sito web. Servono a migliorare l'esperienza di navigazione,
              ricordare le tue preferenze e fornire funzionalita essenziali.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Cookie Utilizzati</h2>
            <p className="text-muted-foreground mb-4">
              Webmaster Monitor utilizza le seguenti categorie di cookie:
            </p>

            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">Cookie Tecnici (Necessari)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Essenziali per il funzionamento del sito. Non richiedono consenso.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Nome</th>
                        <th className="text-left py-2 pr-4">Scopo</th>
                        <th className="text-left py-2">Durata</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-mono text-xs">next-auth.session-token</td>
                        <td className="py-2 pr-4">Autenticazione utente</td>
                        <td className="py-2">Sessione / 30 giorni</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-mono text-xs">next-auth.csrf-token</td>
                        <td className="py-2 pr-4">Protezione CSRF</td>
                        <td className="py-2">Sessione</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-mono text-xs">next-auth.callback-url</td>
                        <td className="py-2 pr-4">Redirect dopo login</td>
                        <td className="py-2">Sessione</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">sb-*</td>
                        <td className="py-2 pr-4">Sessione Supabase</td>
                        <td className="py-2">Sessione</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Cookie Funzionali</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Migliorano l'esperienza utente ricordando le preferenze.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Nome</th>
                        <th className="text-left py-2 pr-4">Scopo</th>
                        <th className="text-left py-2">Durata</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b">
                        <td className="py-2 pr-4 font-mono text-xs">theme</td>
                        <td className="py-2 pr-4">Preferenza tema (chiaro/scuro)</td>
                        <td className="py-2">1 anno</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">sidebar-collapsed</td>
                        <td className="py-2 pr-4">Stato sidebar</td>
                        <td className="py-2">1 anno</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Cookie Analitici (Opzionali)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Ci aiutano a capire come gli utenti utilizzano il sito. Richiedono consenso.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Nome</th>
                        <th className="text-left py-2 pr-4">Scopo</th>
                        <th className="text-left py-2">Durata</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">_ga, _gid</td>
                        <td className="py-2 pr-4">Google Analytics (se abilitato)</td>
                        <td className="py-2">2 anni / 24 ore</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Cookie di Terze Parti</h2>
            <p className="text-muted-foreground mb-4">
              Alcuni servizi esterni potrebbero impostare cookie:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Google:</strong> se utilizzi l'autenticazione OAuth con Google</li>
              <li><strong>GitHub:</strong> se utilizzi l'autenticazione OAuth con GitHub</li>
              <li><strong>Supabase:</strong> per la gestione della sessione database</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Questi cookie sono soggetti alle rispettive policy dei fornitori.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Gestione dei Cookie</h2>
            <p className="text-muted-foreground mb-4">
              Puoi gestire le preferenze sui cookie in diversi modi:
            </p>

            <h3 className="font-semibold mt-4 mb-2">Impostazioni del Browser</h3>
            <p className="text-muted-foreground mb-4">
              Puoi configurare il tuo browser per bloccare o eliminare i cookie:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Chrome:</strong> Impostazioni &gt; Privacy e sicurezza &gt; Cookie
              </li>
              <li>
                <strong>Firefox:</strong> Impostazioni &gt; Privacy e sicurezza &gt; Cookie
              </li>
              <li>
                <strong>Safari:</strong> Preferenze &gt; Privacy &gt; Gestisci dati siti web
              </li>
              <li>
                <strong>Edge:</strong> Impostazioni &gt; Cookie e autorizzazioni sito
              </li>
            </ul>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Nota:</strong> Bloccare i cookie tecnici potrebbe impedire il corretto
                funzionamento del servizio, in particolare l'autenticazione.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Local Storage e Session Storage</h2>
            <p className="text-muted-foreground mb-4">
              Oltre ai cookie, utilizziamo anche:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Local Storage:</strong> per memorizzare preferenze utente persistenti</li>
              <li><strong>Session Storage:</strong> per dati temporanei della sessione corrente</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Puoi cancellare questi dati dalle impostazioni del browser nella sezione
              "Dati dei siti" o "Archiviazione".
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Aggiornamenti</h2>
            <p className="text-muted-foreground">
              Questa Cookie Policy puo essere aggiornata periodicamente.
              Ti invitiamo a consultarla regolarmente per essere informato
              su come utilizziamo i cookie.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Contatti</h2>
            <p className="text-muted-foreground">
              Per domande sui cookie, contattaci a:
              <a href="mailto:privacy@webmaster-monitor.com" className="text-primary hover:underline ml-1">privacy@webmaster-monitor.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Riferimenti Normativi</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Regolamento UE 2016/679 (GDPR)</li>
              <li>Direttiva 2002/58/CE (ePrivacy)</li>
              <li>D.Lgs. 196/2003 (Codice Privacy italiano)</li>
              <li>Linee guida del Garante Privacy sui cookie (2021)</li>
            </ul>
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
