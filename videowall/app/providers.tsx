'use client';

/* * */

import { AppReload } from '@/components/AppReload';
import { theme } from '@/styles/theme';
import { MantineProvider } from '@mantine/core';
import { SWRConfig, SWRConfiguration } from 'swr';

/* * */

export default function Providers({ children }) {
	//

	//
	// A. Setup SWR

	const swrSettings: SWRConfiguration = {
		async fetcher(...args: Parameters<typeof fetch>) {
			const res = await fetch(...args);
			if (!res.ok) {
				const errorDetails = await res.json();
				const error = new Error(errorDetails.message || 'An error occurred while fetching data.');
				const customError = {
					...error,
					description: errorDetails.description || 'No additional information was provided by the API.',
					status: res.status,
				};
				throw customError;
			}
			return res.json();
		},
		refreshInterval: 30000, // 30 seconds
		revalidateOnFocus: true,
		revalidateOnMount: true,
	};

	//
	// B. Render components

	return (
		<SWRConfig value={swrSettings}>
			<MantineProvider defaultColorScheme="auto" theme={theme}>
				<AppReload />
				{children}
			</MantineProvider>
		</SWRConfig>
	);

	//
}
