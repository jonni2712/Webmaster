'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClientForm } from '@/components/clients';
import { ArrowLeft } from 'lucide-react';

export default function NewClientPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Nuovo Cliente</h1>
          <p className="text-sm text-muted-foreground">
            Aggiungi un nuovo cliente alla piattaforma
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <ClientForm />
      </div>
    </div>
  );
}
