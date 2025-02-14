'use client';

/* * */

import { RidesContextProvider } from '@/contexts/Rides.context';
import { RidesListContextProvider } from '@/contexts/RidesList.context';
import { PropsWithChildren } from 'react';

/* * */

export default function Providers({ children }: PropsWithChildren) {
	return (
		<RidesContextProvider>
			<RidesListContextProvider>
				{children}
			</RidesListContextProvider>
		</RidesContextProvider>
	);
}
