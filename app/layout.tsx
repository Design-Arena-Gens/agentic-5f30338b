import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Forex Autonomy',
  description: 'Fully autonomous AI-driven forex trading orchestrator.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-slate-950 text-slate-100">
      <body className="min-h-screen antialiased font-sans">{children}</body>
    </html>
  );
}
