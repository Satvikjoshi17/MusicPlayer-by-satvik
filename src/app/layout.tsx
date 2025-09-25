'use client';

import { MobileNav } from '@/components/music/mobile-nav';
import { SidebarNav } from '@/components/music/sidebar-nav';
import { MiniPlayer } from '@/components/music/mini-player';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/hooks/use-player';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PlayerWrapper } from '@/context/player-context';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { currentTrack } = usePlayer();

  return (
    <html lang="en" className="dark">
       <head>
        <title>satvikx</title>
        <meta name="description" content="A dark-theme, mobile-first music player." />
        <meta name="theme-color" content="#121212" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <PlayerWrapper>
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
        </PlayerWrapper>
        <Toaster />
      </body>
    </html>
  );
}
