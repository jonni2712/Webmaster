import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

// TODO: Riabilitare autenticazione quando OAuth è configurato
// import { redirect } from 'next/navigation';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth/config';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Riabilitare quando OAuth è pronto
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   redirect('/login');
  // }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen w-full lg:w-auto">
        <Header />
        <main className="flex-1 p-4 sm:p-6 bg-muted overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
