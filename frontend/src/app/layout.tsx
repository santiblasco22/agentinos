import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AGENTINOS',
  description: 'Gestioná tus agentes de WhatsApp con IA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen" style={{ background: '#080B14' }}>
        {children}
      </body>
    </html>
  );
}
