'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Activity, Menu } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
}

const defaultLinks: NavLink[] = [
  { href: '/pricing', label: 'Prezzi' },
  { href: '/docs', label: 'Documentazione' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/about', label: 'Chi siamo' },
];

interface MarketingNavbarProps {
  links?: NavLink[];
}

export function MarketingNavbar({ links = defaultLinks }: MarketingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      aria-label="Navigazione principale"
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-white">Webmaster</span>
            <span className="text-[10px] text-zinc-500 leading-tight -mt-0.5 tracking-widest">MONITOR</span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white rounded-md transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white hover:bg-white/5"
            >
              Accedi
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
            >
              Inizia Gratis
            </Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/5">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Apri menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-[#111111] border-white/10 text-white">
            <SheetTitle className="sr-only">Menu navigazione</SheetTitle>
            <div className="flex flex-col gap-6 mt-6">
              <div className="flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2.5 text-base font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5">
                    Accedi
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                    Inizia Gratis
                  </Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
