'use client';

/* * */

import { RidesContextProvider } from '@/contexts/Rides.context';
import { ThemeProvider } from '@tmlmobilidade/ui';
import { PropsWithChildren } from 'react';

/* * */

export default function Providers({ children }: PropsWithChildren) {
	return (
		<ThemeProvider>
			<RidesContextProvider>
				{children}
			</RidesContextProvider>
		</ThemeProvider>
	);
}
