/* * */

import { getSession } from '@/components/authentication/actions/authentication';
import { DashboardProviders } from '@/providers/dashboard-providers';
import { redirect } from 'next/navigation';

/* * */

export default async function DashboardLayout({ children }) {
	const session = await getSession();

	if (!session) {
		redirect('/login');
	}

	return (
		<DashboardProviders>
			{children}
		</DashboardProviders>
	);

	//
}
