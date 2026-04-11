'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  Bell,
  Settings,
  Plus,
  Upload,
  Puzzle,
  Menu,
  Users,
  Map,
  FolderKanban,
  Server,
  Activity,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut, useSession } from 'next-auth/react';

const menuNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Siti',
    href: '/sites',
    icon: Globe,
    children: [
      { name: 'Tutti i siti', href: '/sites' },
      { name: 'Aggiungi sito', href: '/sites/new', icon: Plus },
      { name: 'Importa CSV', href: '/sites/import', icon: Upload },
    ],
  },
  {
    name: 'Alert',
    href: '/alerts',
    icon: Bell,
  },
];

const gestioneNavigation = [
  {
    name: 'Clienti',
    href: '/clients',
    icon: Users,
    children: [
      { name: 'Tutti i clienti', href: '/clients' },
      { name: 'Nuovo cliente', href: '/clients/new', icon: Plus },
    ],
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: FolderKanban,
    children: [
      { name: 'Dashboard', href: '/portfolio' },
      { name: 'Gestione Domini', href: '/portfolio/domains', icon: Globe },
      { name: 'Brand & Zone', href: '/portfolio/zones', icon: Map },
      { name: 'Server', href: '/portfolio/servers', icon: Server },
      { name: 'Importa Domini', href: '/portfolio/import', icon: Upload },
    ],
  },
];

const altroNavigation = [
  {
    name: 'Plugin WP',
    href: '/plugin',
    icon: Puzzle,
  },
  {
    name: 'Roadmap',
    href: '/roadmap',
    icon: Map,
  },
  {
    name: 'Impostazioni',
    href: '/settings',
    icon: Settings,
  },
];

function NavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof menuNavigation)[number];
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <div>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-md transition-colors',
          isActive
            ? 'bg-zinc-100 dark:bg-white/[0.06] text-zinc-900 dark:text-white font-medium'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04] hover:text-zinc-900 dark:hover:text-white'
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        <span>{item.name}</span>
      </Link>

      {/* Submenu */}
      {'children' in item && item.children && isActive && (
        <div className="ml-4 mt-0.5 border-l border-zinc-200 dark:border-white/5 pl-3 space-y-0.5">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2 px-2 py-1 text-sm rounded-md transition-colors',
                pathname === child.href
                  ? 'text-zinc-900 dark:text-white font-medium'
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              )}
            >
              {'icon' in child && child.icon && <child.icon className="h-3.5 w-3.5 flex-shrink-0" />}
              <span>{child.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-2">
      {/* MENU section */}
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 mt-2 px-3">Menu</p>
      <div className="space-y-0.5">
        {menuNavigation.map((item) => (
          <NavItem key={item.name} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>

      {/* GESTIONE section */}
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 mt-6 px-3">Gestione</p>
      <div className="space-y-0.5">
        {gestioneNavigation.map((item) => (
          <NavItem key={item.name} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>

      {/* ALTRO section */}
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 mt-6 px-3">Altro</p>
      <div className="space-y-0.5">
        {altroNavigation.map((item) => (
          <NavItem key={item.name} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}

function UserFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session } = useSession();

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Utente';
  const userEmail = session?.user?.email || '';
  const initials = userName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function handleLogout() {
    if (onNavigate) onNavigate();
    signOut({ callbackUrl: '/login' });
  }

  return (
    <div className="border-t border-zinc-200 dark:border-white/5 p-3">
      <div className="flex items-center gap-2.5 group">
        <Avatar className="h-6 w-6 flex-shrink-0">
          <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">{userName}</p>
          <p className="text-[10px] text-zinc-500 truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex-shrink-0 p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
          title="Esci"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// Mobile Sidebar (Sheet)
export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Apri menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-0 bg-white dark:bg-[#0A0A0A] border-r border-zinc-200 dark:border-white/5">
        <SheetTitle className="sr-only">Menu navigazione</SheetTitle>
        <div className="flex h-12 items-center border-b border-zinc-200 dark:border-white/5 px-4">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">Webmaster Monitor</span>
          </Link>
        </div>
        <SidebarContent onNavigate={() => setOpen(false)} />
        <UserFooter onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Desktop Sidebar
export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-white dark:bg-[#0A0A0A] border-r border-zinc-200 dark:border-white/5">
      {/* Logo */}
      <div className="flex h-12 items-center border-b border-zinc-200 dark:border-white/5 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">Webmaster Monitor</span>
        </Link>
      </div>

      {/* Navigation */}
      <SidebarContent />

      {/* User Footer */}
      <UserFooter />
    </aside>
  );
}
