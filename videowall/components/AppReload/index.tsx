'use client';

/* * */

import { useEffect } from 'react';

/* * */

export function AppReload() {
	//

	//
	// A. Handle actions

	useEffect(() => {
		// Reload every 5 minutes
		const interval = setTimeout(() => {
			window.location.reload();
		}, 300000);
		return () => clearTimeout(interval);
	}, []);

	//
	// B. Render components

	return <div />;

	//
}
