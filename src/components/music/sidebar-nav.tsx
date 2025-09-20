'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ListMusic, Download, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
];

const libraryNavItems = [
  { href: '/playlists', label: 'Playlists', icon: ListMusic },
  { href: '/downloads', label: 'Downloads', icon: Download },
  { href: '/recent', label: 'Recent', icon: History },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:bg-background md:p-4">
      <div className="flex items-center gap-2 mb-8">
        <svg
          role="img"
          aria-label="satvikx Logo"
          className="h-8 w-8 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-8C10.07 8.5 8.5 10.07 8.5 12s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z"/>
        </svg>
        <h1 className="text-xl font-bold font-headline">satvikx</h1>
      </div>
      <nav className="flex-1 space-y-6">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
             const isActive = (pathname === '/' && item.href === '/') || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-secondary',
                  isActive && 'bg-secondary text-primary'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <Separator />
        <div className="space-y-1">
            <h2 className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider">Library</h2>
            {libraryNavItems.map((item) => {
                 const isActive = pathname.startsWith(item.href);
                return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-secondary',
                    isActive && 'bg-secondary text-primary'
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                </Link>
                );
            })}
        </div>
      </nav>
    </aside>
  );
}
