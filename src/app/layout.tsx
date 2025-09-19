import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PlayerProvider } from '@/context/player-context';

export const metadata: Metadata = {
  title: 'satvikx',
  description: 'A dark-theme, mobile-first PWA music player.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#121212',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <PlayerProvider>
          {children}
        </PlayerProvider>
        <Toaster />
      </body>
    </html>
  );
}
