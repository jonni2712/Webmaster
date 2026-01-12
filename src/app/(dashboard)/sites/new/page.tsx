import { Suspense } from 'react';
import { SiteForm } from '@/components/sites/site-form';
import { Skeleton } from '@/components/ui/skeleton';

function SiteFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function NewSitePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Aggiungi Sito</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configura un nuovo sito da monitorare
        </p>
      </div>

      <Suspense fallback={<SiteFormSkeleton />}>
        <SiteForm />
      </Suspense>
    </div>
  );
}
