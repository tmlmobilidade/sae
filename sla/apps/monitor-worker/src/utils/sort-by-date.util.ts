/* * */

import { DateTime } from 'luxon';

/**
 * Sorts an array of objects by date
 * @param data
 * @param key
 * @param direction
 * @returns
 */
export function sortByDate<T>(data: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
	//

	if (direction === 'asc') {
		return [...data].sort((a: T, b: T) => {
			return DateTime.fromJSDate(a[key] as Date).toMillis() - DateTime.fromJSDate(b[key] as Date).toMillis();
		});
	}

	if (direction === 'desc') {
		return [...data].sort((a: T, b: T) => {
			return DateTime.fromJSDate(b[key] as Date).toMillis() - DateTime.fromJSDate(a[key] as Date).toMillis();
		});
	}

	//
}
