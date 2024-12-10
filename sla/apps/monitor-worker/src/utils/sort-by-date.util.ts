/* * */

import { DateTime } from 'luxon';

/* * */

export function sortByDate<T>(data: T[], key: keyof T): T[] {
	return data.sort((a: T, b: T) => {
		return DateTime.fromJSDate(a[key] as Date).toMillis() - DateTime.fromJSDate(b[key] as Date).toMillis();
	});
}
