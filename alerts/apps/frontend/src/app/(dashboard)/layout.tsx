/* * */

import { DashboardProviders } from '@/providers/dashboard-providers';

/* * */

export default async function DashboardLayout({ children }) {
	//

	//
	// A. Fetch data

	//
	// B. Render components

	return (
		<DashboardProviders>
			{children}
		</DashboardProviders>
	);

	//
}
