WITH

	/*
	 * Capture the current time once so all derived statuses use exactly
	 * the same timestamp.
	 */
	toUnixTimestamp64Milli(now64(3)) AS now_ms,

	/*
	 * -----------------------------------------------------------------------
	 * Operational date bounds
	 * -----------------------------------------------------------------------
	 *
	 * operation.rides and the analysis tables are partitioned by
	 * intDiv(operational_date, 100) and carry a min-max index on
	 * operational_date. Deriving the bounds from the scheduled start range
	 * (padded by one day on each side, because an operational day does not
	 * coincide with a calendar day) lets ClickHouse prune partitions and
	 * parts before reading anything, and removes the need to ask the ride
	 * set for its operational dates.
	 */
	toYYYYMMDD(fromUnixTimestamp64Milli(toInt64($1)) - INTERVAL 1 DAY) AS operational_date_from,
	toYYYYMMDD(fromUnixTimestamp64Milli(toInt64($2)) + INTERVAL 1 DAY) AS operational_date_to,

	/*
	 * -----------------------------------------------------------------------
	 * Rides available to this query
	 * -----------------------------------------------------------------------
	 *
	 * Rides use ReplacingMergeTree(updated_at). The latest physical version
	 * is selected explicitly (ORDER BY updated_at DESC LIMIT 1 BY _id)
	 * instead of using FINAL.
	 *
	 * Only the columns the response needs are read, so the sort and the
	 * per-part statistics loading are proportional to that projection and
	 * not to the full table width.
	 *
	 * The RIDE FILTERS marker receives the filters on attributes that are
	 * identical across every version of a ride (agency, route, search on
	 * id/headsign). Applying them before LIMIT BY lets the primary key
	 * (agency_id first) prune the read and keeps the sort small. Filters on
	 * attributes that change between versions (driver_ids, vehicle_ids and
	 * every derived status/grade) must stay in the final WHERE.
	 *
	 * The exact-ride branch is only present when a search term is given.
	 * It adds the ride whose id is exactly the search term even when it is
	 * outside the requested date range. The LIMIT BY over the union keeps a
	 * single version when that ride is also part of the range.
	 */
	rides_for_query AS
	(
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
			updated_at,
			vehicle_ids
		FROM
		(
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
				updated_at,
				vehicle_ids
			FROM operation.rides
			WHERE
				operational_date BETWEEN operational_date_from AND operational_date_to
				AND start_time_scheduled >= $1
				AND start_time_scheduled <= $2
				--RIDE FILTERS HERE--

			--EXACT RIDE BRANCH START--
			UNION ALL

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
				updated_at,
				vehicle_ids
			FROM operation.rides
			WHERE
				_id = $3
				--RIDE FILTERS HERE--
			--EXACT RIDE BRANCH END--
		)
		ORDER BY
			updated_at DESC
		LIMIT 1 BY _id
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
	 * The same operational date bounds prune the analysis partitions, and
	 * the ANALYSIS FILTERS marker receives the agency filter, so each table
	 * is read once for the requested range instead of being driven by a
	 * subquery over the ride set.
	 *
	 * An exact-ride hit outside the requested date range is returned
	 * without grades.
	 */

	analysis_at_least_one_vehicle_event_on_last_stop AS
	(
		SELECT
			ride_id,
			argMax(grade_status, updated_at) AS grade_status
		FROM operation.ride_analysis_at_least_one_vehicle_event_on_last_stop
		WHERE operational_date BETWEEN operational_date_from AND operational_date_to
		GROUP BY ride_id
	),

	analysis_expected_apex_validation_interval AS
	(
		SELECT
			ride_id,
			argMax(grade_status, updated_at) AS grade_status
		FROM operation.ride_analysis_expected_apex_validation_interval
		WHERE operational_date BETWEEN operational_date_from AND operational_date_to
		GROUP BY ride_id
	),

	analysis_simple_three_vehicle_events AS
	(
		SELECT
			ride_id,
			argMax(grade_status, updated_at) AS grade_status
		FROM operation.ride_analysis_simple_three_vehicle_events
		WHERE operational_date BETWEEN operational_date_from AND operational_date_to
		GROUP BY ride_id
	),

	analysis_transaction_sequentiality AS
	(
		SELECT
			ride_id,
			argMax(grade_status, updated_at) AS grade_status
		FROM operation.ride_analysis_transaction_sequentiality
		WHERE operational_date BETWEEN operational_date_from AND operational_date_to
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
	--DERIVED FILTERS HERE--

ORDER BY
	start_time_scheduled ASC,
	_id ASC

LIMIT 10000

/*
 * Per-part column statistics (ClickHouse 26.x) are loaded for every part of
 * every referenced table at plan time, which costs several seconds on
 * operation.rides regardless of the date range. The primary key and the
 * min-max index prune the same parts without them.
 */
SETTINGS use_statistics = 0
