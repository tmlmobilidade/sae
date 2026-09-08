'use client';

import { useLinesData } from '@/components/lines/use-lines-data';
import { useMemo } from 'react';

/* * */

export function useLinesByShortName() {
	const { data: lines } = useLinesData();

	return useMemo(() => {
		return new Map(lines.map(line => [line.short_name, line]));
	}, [lines]);
}
