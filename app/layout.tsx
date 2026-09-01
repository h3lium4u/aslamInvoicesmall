import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Navigation } from '@/components/layout/Navigation';

export const metadata: Metadata = {
  title: 'Western Industries — Stock Statement Register',
  description: 'Digital stock statement and inventory register application for Western Industries.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: '48px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
