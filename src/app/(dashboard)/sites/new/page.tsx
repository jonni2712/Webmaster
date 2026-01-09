import { SiteForm } from '@/components/sites/site-form';

export default function NewSitePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Aggiungi Sito</h1>
        <p className="text-muted-foreground">
          Configura un nuovo sito da monitorare
        </p>
      </div>

      <SiteForm />
    </div>
  );
}
