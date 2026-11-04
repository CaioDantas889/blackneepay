import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'NewPay · A nossa maior Black', description: 'Cada venda conta. Acompanhe as metas e o ranking da Black Friday NewPay 2026.', icons: { icon: '/favicon.svg' } };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="pt-BR"><body>{children}</body></html>; }
