/* * */

import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { useMemo } from 'react';

import { Tag } from '../../components/tags';

/* * */

interface UnixMillisecondsDisplayProps {

	/**
	 * Whether to show the date
	 * @default false
	 */
	showDate?: boolean

	/**
	 * Whether to show the seconds
	 * @default false
	 */
	showSeconds?: boolean

	/**
	 * Whether to show the time
	 * @default true
	 */
	showTime?: boolean

	/**
	 * The UnixMilliseconds to display, in milliseconds
	 * @example 1718534400000
	 */
	value: UnixMilliseconds
}

/* * */

export function UnixMillisecondsDisplay({ showDate = false, showSeconds = false, showTime = true, value }: UnixMillisecondsDisplayProps) {
	//

	//
	// A. Transform data

	const format = useMemo(() => {
		const format: string[] = [];
		if (showDate) format.push('yyyy-LL-dd ');
		if (showTime) format.push('HH:mm');
		if (showTime && showSeconds) format.push(':ss');
		return format.join('').trim();
	}, [showDate, showSeconds, showTime]);

	const unixMillisecondsDisplayValue = useMemo(() => {
		// Skip if no value or value is Infinity
		if (!value) return;
		if (value === Infinity || value === -Infinity) return;
		// Format the timestamp
		return Dates.fromUnixMilliseconds(value).toFormat(format);
	}, [value, format]);

	//
	// B. Render components

	if (!unixMillisecondsDisplayValue) return;

	return <Tag label={unixMillisecondsDisplayValue} variant="muted" />;
}
