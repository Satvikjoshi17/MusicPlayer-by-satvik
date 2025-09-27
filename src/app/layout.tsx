
'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { PlayerWrapper } from '@/context/player-context';
import { AppWrapper } from '@/components/app-wrapper';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isPlayerPage = pathname === '/player';

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <PlayerWrapper>
          {isPlayerPage ? (
            children
          ) : (
            <AppWrapper>
              {children}
            </AppWrapper>
          )}
        </PlayerWrapper>
        <Toaster />
      </body>
    </html>
  );
}
