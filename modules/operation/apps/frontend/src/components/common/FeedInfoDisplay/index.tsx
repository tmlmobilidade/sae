'use client';

import { type GtfsFeedInfo } from '@tmlmobilidade/go-types-gtfs';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { Grid, ValueDisplay } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

/* * */

interface FeedInfoDisplayProps {
	data?: GtfsFeedInfo
}

/* * */

export function FeedInfoDisplay({ data }: FeedInfoDisplayProps) {
	//

	//
	// A. Transform data

	const feedStartDateParsed = useMemo(() => {
		try {
			if (!data?.feed_start_date) return null;
			return Dates
				.fromOperationalDateInt(data?.feed_start_date, 'Europe/Lisbon')
				.toFormat('yyyy-LL-dd');
		} catch (error) {
			console.log(error);
			return null;
		}
	}, [data?.feed_start_date]);

	const feedEndDateParsed = useMemo(() => {
		try {
			if (!data?.feed_end_date) return null;
			return Dates
				.fromOperationalDateInt(data?.feed_end_date, 'Europe/Lisbon')
				.toFormat('yyyy-LL-dd');
		} catch (error) {
			console.log(error);
			return null;
		}
	}, [data?.feed_end_date]);

	//
	// B. Render components

	return (
		<Grid columns="abc" gap="lg">
			<ValueDisplay label="feed_start_date" value={`${feedStartDateParsed} (${data?.feed_start_date || 'N/A'})`} />
			<ValueDisplay label="feed_end_date" value={`${feedEndDateParsed} (${data?.feed_end_date || 'N/A'})`} />
			<ValueDisplay label="feed_version" value={data?.feed_version || 'N/A'} />
			<ValueDisplay label="feed_contact_email" value={data?.feed_contact_email || 'N/A'} />
			<ValueDisplay label="feed_contact_url" value={data?.feed_contact_url || 'N/A'} />
			<ValueDisplay label="feed_publisher_name" value={data?.feed_publisher_name || 'N/A'} />
			<ValueDisplay label="feed_publisher_url" value={data?.feed_publisher_url || 'N/A'} />
		</Grid>
	);
}
