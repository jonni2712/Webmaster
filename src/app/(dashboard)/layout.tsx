import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#070707]">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen w-full lg:w-auto">
        <Header />
        <main className="flex-1 p-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
