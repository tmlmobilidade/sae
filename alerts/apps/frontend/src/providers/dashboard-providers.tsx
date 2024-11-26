/* * */

import { AlertsListContextProvider } from '@/contexts/AlertsList.context';

/* * */
export function DashboardProviders({ children }) {
	return (
		<AlertsListContextProvider>
			{children}
		</AlertsListContextProvider>
	);
}
