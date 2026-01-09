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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
