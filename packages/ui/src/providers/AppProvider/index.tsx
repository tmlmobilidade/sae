'use client';

import { type PropsWithChildren } from 'react';

import { LayoutContextProvider } from '../../contexts/Layout.context';
import { MapContextProvider } from '../../contexts/Map.context';
import { MeContextProvider } from '../../contexts/Me.context';

/**
 * `AppProvider` component that wraps the application with necessary context providers.
 * This should wrap the whole authenticated application. For non-authenticated
 * parts of the application, use only the `BaseProvider` component.
 */
export function AppProvider({ children }: PropsWithChildren) {
	return (
		<MeContextProvider>
			<LayoutContextProvider>
				<MapContextProvider>
					{children}
				</MapContextProvider>
			</LayoutContextProvider>
		</MeContextProvider>
	);
}
