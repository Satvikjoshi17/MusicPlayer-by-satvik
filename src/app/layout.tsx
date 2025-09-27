

import './globals.css';

import { Toaster } from '@/components/ui/toaster';
import { PlayerWrapper } from '@/context/player-context';
import { AppWrapper } from '@/components/app-wrapper';

export const metadata = {
  title: 'satvikx',
  description: 'A dark-theme, mobile-first music player.',
};

export const viewport = {
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
        <PlayerWrapper>
          <AppWrapper>
            {children}
          </AppWrapper>
        </PlayerWrapper>
        <Toaster />
      </body>
    </html>
  );
}
