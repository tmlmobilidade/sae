/* * */

import { getSession } from '@/components/authentication/actions/authentication';
import { DashboardProviders } from '@/providers/dashboard-providers';
import { redirect } from 'next/navigation';

/* * */

export default async function AuthenticationLayout({ children }) {
	const session = await getSession();

	if (session) {
		redirect('/alerts');
	}

	return (
		<DashboardProviders>
			{children}
		</DashboardProviders>
	);

	//
}
