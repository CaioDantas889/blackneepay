import { redirect } from 'next/navigation';
import { currentAdmin } from '@/lib/admin-auth';
import Campaign from '../campaign';
export const dynamic = 'force-dynamic';
export default async function Admin() {
 if (!await currentAdmin()) redirect('/admin/login');
 return <Campaign admin />;
}
