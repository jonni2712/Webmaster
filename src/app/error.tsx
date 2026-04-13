'use client';

import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <p className="text-5xl font-bold text-emerald-500 mb-4">Ops!</p>

        <h1 className="text-3xl font-bold mb-4">Qualcosa e&apos; andato storto</h1>

        <p className="text-gray-400 text-lg mb-10">
          Stiamo lavorando per risolvere il problema. Riprova tra qualche istante.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
          >
            Riprova
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:border-gray-500 hover:text-white transition-colors"
          >
            Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
