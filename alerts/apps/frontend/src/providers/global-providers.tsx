/* * */

import { ThemeProviders } from '@/providers/theme-providers';
import { websiteTheme } from '@/themes/website/website.theme';
import { Notifications } from '@mantine/notifications';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

/* * */

export function GlobalProviders({ children }) {
	return (
		<ThemeProviders themeData={websiteTheme}>
			<NuqsAdapter>
				<Notifications styles={{ root: { marginTop: '60px' } }} />
				{children}
			</NuqsAdapter>
		</ThemeProviders>
	);
}
