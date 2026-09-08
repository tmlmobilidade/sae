/* * */

export const controllerRidesListQuery = `
WITH

	/*
	 * Capture the current time once so all derived statuses use exactly
	 * the same timestamp.
	 */
	toUnixTimestamp64Milli(now64(3)) AS now_ms,

	/*
	 * -----------------------------------------------------------------------
	 * Exact Ride version
	 * -----------------------------------------------------------------------
	 *
	 * Select the exact ride version explicitly by its ID using
	 * text search parameter $3.
	 */
	exact_ride AS
	(
		SELECT
			*
		FROM operation.rides
		WHERE
			_id = $3
		ORDER BY
			updated_at DESC
		LIMIT 1 BY _id
	),

	/*
	 * -----------------------------------------------------------------------
	 * Latest Ride version
	 * -----------------------------------------------------------------------
	 *
	 * Rides use ReplacingMergeTree(updated_at).
	 *
	 * Select the latest physical version explicitly instead of using FINAL.
	 *
	 * The scheduled start time range is applied before LIMIT BY so that
	 * ClickHouse can discard irrelevant data as early as possible.
	 */
	rides_latest AS
	(
		SELECT
			*
		FROM operation.rides
		WHERE
			start_time_scheduled >= $1
			AND start_time_scheduled <= $2
		ORDER BY
			updated_at DESC
		LIMIT 1 BY _id
	),

	/*
	 * -----------------------------------------------------------------------
	 * Rides available to this query
	 * -----------------------------------------------------------------------
	 *
	 * The exact Ride is added to the normal date-filtered set.
	 *
	 * DISTINCT prevents the exact Ride from appearing twice when it already
	 * belongs to the requested date range.
	 */
	rides_for_query AS
	(
		SELECT *
		FROM rides_latest
		UNION DISTINCT
		SELECT *
		FROM exact_ride
	),

	/*
	 * -----------------------------------------------------------------------
	 * Latest analysis versions
	 * -----------------------------------------------------------------------
	 *
	 * Each analysis table uses ReplacingMergeTree(updated_at).
	 *
	 * argMax() returns the grade from the latest version without requiring
	 * FINAL.
	 *
	 * Only rides in the selected date range are considered.
	 */

	analysis_at_least_one_vehicle_event_on_last_stop AS
	(
		SELECT
			ride_id,
			argMax(grade_status, updated_at) AS grade_status
		FROM operation.ride_analysis_at_least_one_vehicle_event_on_last_stop
		WHERE operational_date IN
		(
			SELECT DISTINCT operational_date
			FROM rides_for_query
		)
		GROUP BY ride_id
	),

	analysis_expected_apex_validation_interval AS
	(
		SELECT
			ride_id,
			argMax(grade_status, updated_at) AS grade_status
		FROM operation.ride_analysis_expected_apex_validation_interval
		WHERE operational_date IN
		(
			SELECT DISTINCT operational_date
			FROM rides_for_query
		)
		GROUP BY ride_id
	),

	analysis_simple_three_vehicle_events AS
	(
		SELECT
			ride_id,
			argMax(grade_status, updated_at) AS grade_status
		FROM operation.ride_analysis_simple_three_vehicle_events
		WHERE operational_date IN
		(
			SELECT DISTINCT operational_date
			FROM rides_for_query
		)
		GROUP BY ride_id
	),

	analysis_transaction_sequentiality AS
	(
		SELECT
			ride_id,
			argMax(grade_status, updated_at) AS grade_status
		FROM operation.ride_analysis_transaction_sequentiality
		WHERE operational_date IN
		(
			SELECT DISTINCT operational_date
			FROM rides_for_query
		)
		GROUP BY ride_id
	),

	/*
	 * -----------------------------------------------------------------------
	 * Join the latest Ride with the latest analysis results.
	 * -----------------------------------------------------------------------
	 */
	ride_with_analyses AS
	(
		SELECT
			r.*,

			analysis_at_least_one_vehicle_event_on_last_stop.grade_status
				AS _analysis_at_least_one_vehicle_event_on_last_stop_grade,

			analysis_expected_apex_validation_interval.grade_status
				AS _analysis_expected_apex_validation_interval_grade,

			analysis_simple_three_vehicle_events.grade_status
				AS _analysis_simple_three_vehicle_events_grade,

			analysis_transaction_sequentiality.grade_status
				AS _analysis_transaction_sequentiality_grade

		FROM rides_for_query AS r

		LEFT JOIN analysis_at_least_one_vehicle_event_on_last_stop
			ON analysis_at_least_one_vehicle_event_on_last_stop.ride_id = r._id

		LEFT JOIN analysis_expected_apex_validation_interval
			ON analysis_expected_apex_validation_interval.ride_id = r._id

		LEFT JOIN analysis_simple_three_vehicle_events
			ON analysis_simple_three_vehicle_events.ride_id = r._id

		LEFT JOIN analysis_transaction_sequentiality
			ON analysis_transaction_sequentiality.ride_id = r._id
	),

	/*
	 * -----------------------------------------------------------------------
	 * Calculate derived statuses.
	 * -----------------------------------------------------------------------
	 */
	ride_with_statuses AS
	(
		SELECT
			*,

			/*
			 * Operational status
			 */
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

			/*
			 * Seen status
			 */
			CASE
				WHEN seen_last_at IS NULL
				THEN 'unseen'

				WHEN now_ms - seen_last_at <= 30000
				THEN 'seen'

				ELSE 'gone'
			END AS seen_status,

			/*
			 * Start delay status
			 */
			CASE
				WHEN start_time_observed IS NULL
				THEN NULL

				WHEN start_time_observed - start_time_scheduled > 300000
				THEN 'delayed'

				WHEN start_time_observed - start_time_scheduled < -60000
				THEN 'early'

				ELSE 'ontime'
			END AS start_delay_status,

			/*
			 * End delay status
			 */
			CASE
				WHEN end_time_observed IS NULL
				THEN NULL

				WHEN end_time_observed - end_time_scheduled > 300000
				THEN 'delayed'

				WHEN end_time_observed - end_time_scheduled < -60000
				THEN 'early'

				ELSE 'ontime'
			END AS end_delay_status

		FROM ride_with_analyses
	),

	/*
	 * -----------------------------------------------------------------------
	 * Calculate the effective analysis grades.
	 * -----------------------------------------------------------------------
	 *
	 * Analysis is not applicable while a ride is scheduled or running.
	 * Therefore those states intentionally produce NULL.
	 *
	 * For missed/ended rides:
	 *
	 *   analysis exists     -> its grade
	 *   analysis unavailable -> NULL
	 */
	ride_view AS
	(
		SELECT
			*,

			CASE
				WHEN operational_status IN ('scheduled', 'running')
				THEN NULL
				ELSE _analysis_at_least_one_vehicle_event_on_last_stop_grade
			END AS analysis_at_least_one_vehicle_event_on_last_stop_grade,

			CASE
				WHEN operational_status IN ('scheduled', 'running')
				THEN NULL
				ELSE _analysis_expected_apex_validation_interval_grade
			END AS analysis_expected_apex_validation_interval_grade,

			CASE
				WHEN operational_status IN ('scheduled', 'running')
				THEN NULL
				ELSE _analysis_simple_three_vehicle_events_grade
			END AS analysis_simple_three_vehicle_events_grade,

			CASE
				WHEN operational_status IN ('scheduled', 'running')
				THEN NULL
				ELSE _analysis_transaction_sequentiality_grade
			END AS analysis_transaction_sequentiality_grade

		FROM ride_with_statuses
	)

SELECT
	_id,
	agency_id,
	driver_ids,
	end_time_observed,
	end_time_scheduled,
	headsign,
	operational_date,
	passengers_observed,
	seen_last_at,
	shape_id,
	start_time_observed,
	start_time_scheduled,
	timezone,
	vehicle_ids,

	operational_status,
	seen_status,
	start_delay_status,
	end_delay_status,

	analysis_at_least_one_vehicle_event_on_last_stop_grade,
	analysis_expected_apex_validation_interval_grade,
	analysis_simple_three_vehicle_events_grade,
	analysis_transaction_sequentiality_grade

FROM ride_view

WHERE
	1 = 1
	--DYNAMIC FILTERS HERE--

ORDER BY
	start_time_scheduled ASC,
	_id ASC

LIMIT 10000;
`;
