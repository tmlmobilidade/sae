'use client';

/* * */

import { LinesContextProvider } from '@/contexts/Lines.context';
import { StopsContextProvider } from '@/contexts/Stops.context';

/* * */

export function DataProviders({ children }: { children: React.ReactNode }) {
	return (
		<StopsContextProvider>
			<LinesContextProvider>
				{children}
			</LinesContextProvider>
		</StopsContextProvider>
	);
}
