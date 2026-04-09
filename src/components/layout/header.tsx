'use client';

import { signOut, useSession } from 'next-auth/react';
import { Bell, LogOut, User, Moon, Sun, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { MobileSidebar } from './sidebar';

export function Header() {
  const { theme, setTheme } = useTheme();
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
    signOut({ callbackUrl: '/login' });
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 sm:h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Trigger */}
        <MobileSidebar />

        {/* Mobile Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <Globe className="h-5 w-5 text-primary" />
          <span className="font-bold text-base sm:text-lg">Webmaster</span>
        </Link>

        {/* Desktop Title - Hidden on mobile */}
        <h1 className="hidden lg:block text-lg font-semibold">Dashboard</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10" asChild>
          <Link href="/alerts">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Notifiche</span>
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full">
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                <AvatarFallback className="text-xs sm:text-sm">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="mr-2 h-4 w-4" />
                <span>Impostazioni</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Esci</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
