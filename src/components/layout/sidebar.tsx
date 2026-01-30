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
  ChevronLeft,
  ChevronRight,
  Puzzle,
  Menu,
  X,
  Users,
  Map,
  FolderKanban,
  Server,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

const navigation = [
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
      { name: 'Server', href: '/portfolio/servers', icon: Server },
    ],
  },
  {
    name: 'Alert',
    href: '/alerts',
    icon: Bell,
  },
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

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-2">
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <div key={item.name}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>

            {/* Submenu */}
            {!collapsed && item.children && isActive && (
              <div className="ml-8 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                      pathname === child.href
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {child.icon && <child.icon className="h-4 w-4" />}
                    <span>{child.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Mobile Sidebar (Sheet)
export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Apri menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Menu navigazione</SheetTitle>
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Globe className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Webmaster</span>
          </Link>
        </div>
        <SidebarContent collapsed={false} onNavigate={() => setOpen(false)} />
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground text-center">
            Webmaster Monitor v1.0
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Desktop Sidebar
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Webmaster</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            <Globe className="h-6 w-6 text-primary mx-auto" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <SidebarContent collapsed={collapsed} />

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground text-center">
            Webmaster Monitor v1.0
          </p>
        </div>
      )}
    </aside>
  );
}
