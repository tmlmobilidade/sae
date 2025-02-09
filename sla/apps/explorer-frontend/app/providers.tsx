'use client';

/* * */

import { RidesContextProvider } from '@/contexts/Rides.context';
import { PropsWithChildren } from 'react';

/* * */

export default function Providers({ children }: PropsWithChildren) {
	return (
		<RidesContextProvider>
			{children}
		</RidesContextProvider>
	);
}
