import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';
import '@/styles/animations.css';
import Notifications from '@/components/ui/notifications';
import { ClientNavbar } from '@/components/layout/client-navbar';
import { ClientEffects } from '@/components/effects/client-effects';
import SimpleStatusIndicator from '@/components/ui/connection-status/SimpleStatusIndicator';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Synaptic Forest',
  description: 'A revolutionary AI knowledge ecosystem',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <ClientEffects />
            <ClientNavbar />
            <main className="flex-grow">
              {children}
            </main>
            <Notifications />
            <SimpleStatusIndicator />
          </div>
        </Providers>
      </body>
    </html>
  );
}
