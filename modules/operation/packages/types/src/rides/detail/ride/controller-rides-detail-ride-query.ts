/* * */

export const controllerRidesDetailRideQuery = `
WITH

	/*
	 * Capture the current time once so all derived statuses use exactly
	 * the same timestamp.
	 */
	toUnixTimestamp64Milli(now64(3)) AS now_ms,

	/*
	 * -----------------------------------------------------------------------
	 * Latest Ride version
	 * -----------------------------------------------------------------------
	 */
	ride_latest AS
	(
		SELECT
			*
		FROM operation.rides
		WHERE
			_id = $1
		ORDER BY
			updated_at DESC
		LIMIT 1 BY _id
	),

	/*
	 * -----------------------------------------------------------------------
	 * Calculate derived statuses
	 * -----------------------------------------------------------------------
	 */
	ride_view AS
	(
		SELECT
			*,

			CASE
				WHEN
					seen_last_at IS NULL
					AND now_ms - start_time_scheduled <= 600000
				THEN 'scheduled'

				WHEN
					seen_last_at IS NULL
					AND now_ms - start_time_scheduled > 600000
				THEN 'missed'

				WHEN
					seen_last_at IS NOT NULL
					AND now_ms - seen_last_at <= 600000
				THEN 'running'

				ELSE 'ended'
			END AS operational_status,

			CASE
				WHEN seen_last_at IS NULL
				THEN 'unseen'

				WHEN now_ms - seen_last_at <= 30000
				THEN 'seen'

				ELSE 'gone'
			END AS seen_status,

			CASE
				WHEN start_time_observed IS NULL
				THEN NULL

				WHEN start_time_observed - start_time_scheduled > 300000
				THEN 'delayed'

				WHEN start_time_observed - start_time_scheduled < -60000
				THEN 'early'

				ELSE 'ontime'
			END AS start_delay_status,

			CASE
				WHEN end_time_observed IS NULL
				THEN NULL

				WHEN end_time_observed - end_time_scheduled > 300000
				THEN 'delayed'

				WHEN end_time_observed - end_time_scheduled < -60000
				THEN 'early'

				ELSE 'ontime'
			END AS end_delay_status

		FROM ride_latest
	)

SELECT
	*

FROM ride_view

LIMIT 1;
`;
