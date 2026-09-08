'use client';

import { AnalyticsContextProvider } from '@/contexts/Analytics.context';
import { UserLocationContextProvider } from '@/contexts/UserLocation.context';
import { MapProvider } from '@vis.gl/react-maplibre';
import { type PropsWithChildren } from 'react';

/* * */

export function Providers({ children }: PropsWithChildren) {
	return (
		<UserLocationContextProvider>
			<MapProvider>
				<AnalyticsContextProvider>
					{children}
				</AnalyticsContextProvider>
			</MapProvider>
		</UserLocationContextProvider>
	);
}
