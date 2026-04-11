'use client';

import { signOut, useSession } from 'next-auth/react';
import { Bell, LogOut, User, Moon, Sun, Search } from 'lucide-react';
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
    <header className="flex h-12 items-center justify-between border-b border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0A0A0A] px-4">
      <div className="flex items-center gap-2">
        {/* Mobile Menu Trigger */}
        <MobileSidebar />
      </div>

      <div className="flex items-center gap-1">
        {/* Search shortcut hint */}
        <button
          type="button"
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mr-1"
        >
          <Search className="h-3 w-3" />
          <span>Cerca...</span>
          <kbd className="ml-1 text-[10px] font-mono bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
          asChild
        >
          <Link href="/alerts">
            <Bell className="h-4 w-4" />
            {/* Red dot indicator */}
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            <span className="sr-only">Notifiche</span>
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
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
