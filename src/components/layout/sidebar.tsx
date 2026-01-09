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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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
    name: 'Alert',
    href: '/alerts',
    icon: Bell,
  },
  {
    name: 'Impostazioni',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-background transition-all duration-300',
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
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
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
