
'use client';

import { MobileNav } from '@/components/music/mobile-nav';
import { SidebarNav } from '@/components/music/sidebar-nav';
import { MiniPlayer } from '@/components/music/mini-player';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/hooks/use-player';

export function AppWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { currentTrack } = usePlayer();

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-background">
      <SidebarNav />
      <MobileNav />
      <main className={cn(
        "flex-1 overflow-y-auto transition-all duration-300",
        // Add padding bottom to avoid content being hidden by mini-player and mobile nav
        currentTrack ? 'pb-40 md:pb-24' : 'pb-20 md:pb-4'
      )}>
        {children}
      </main>
      <MiniPlayer />
    </div>
  );
}
