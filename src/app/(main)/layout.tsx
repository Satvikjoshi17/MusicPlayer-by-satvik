'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/music/mobile-nav';
import { SidebarNav } from '@/components/music/sidebar-nav';
import { MiniPlayer } from '@/components/music/mini-player';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/hooks/use-player';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const { currentTrack } = usePlayer();

  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-background">
      {isMobile ? <MobileNav /> : <SidebarNav />}
      <main className={cn(
        "flex-1 overflow-y-auto transition-all duration-300",
        // Add padding bottom to avoid content being hidden by mini-player and nav
        currentTrack ? 'pb-36' : 'pb-20', 
        'md:pb-0',
        currentTrack ? 'md:mb-20' : ''
      )}>
        {children}
      </main>
      <MiniPlayer />
    </div>
  );
}
