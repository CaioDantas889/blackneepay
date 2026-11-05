import type { Metadata } from 'next';
import LiveDashboard from './live-dashboard';
export const metadata: Metadata = { title: 'NewPay · Top 3 ao vivo', description: 'O pódio de vendas da Black Friday NewPay.' };
export default function Dashboard() { return <LiveDashboard/>; }
