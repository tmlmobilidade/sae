/* * */

export const alertsStopsQuery = `
WITH

	/*
	 * -----------------------------------------------------------------------
	 * Latest rides in the requested interval
	 * -----------------------------------------------------------------------
	 *
	 * Only rides belonging to the requested agency and scheduled time
	 * interval are relevant.
	 *
	 * Rides use ReplacingMergeTree(updated_at), so explicitly select the
	 * latest version instead of using FINAL.
	 */
	rides_latest AS
	(
		SELECT
			*
		FROM operation.rides

		WHERE
			agency_id = $1
			AND start_time_scheduled >= $2
			AND start_time_scheduled <= $3

		ORDER BY
			updated_at DESC

		LIMIT 1 BY _id
	),

	/*
	 * -----------------------------------------------------------------------
	 * Relevant hashed trips
	 * -----------------------------------------------------------------------
	 *
	 * Multiple rides can reference the same hashed trip.
	 *
	 * Only hashed trips referenced by at least one ride in the requested
	 * interval are relevant.
	 */
	relevant_hashed_trip_ids AS
	(
		SELECT DISTINCT
			hashed_trip_id
		FROM rides_latest
		WHERE
			hashed_trip_id != ''
	),

	/*
	 * -----------------------------------------------------------------------
	 * Latest hashed trip stop versions
	 * -----------------------------------------------------------------------
	 *
	 * hashed_trips uses ReplacingMergeTree(updated_at).
	 *
	 * The primary key is (_id, stop_sequence), so explicitly select the
	 * latest version for each stop of each hashed trip.
	 */
	hashed_trips_latest AS
	(
		SELECT
			*
		FROM operation.hashed_trips

		WHERE
			agency_id = $1
			AND _id IN (
				SELECT
					hashed_trip_id
				FROM relevant_hashed_trip_ids
			)

		ORDER BY
			updated_at DESC

		LIMIT 1 BY _id, stop_sequence
	),

	/*
	 * -----------------------------------------------------------------------
	 * Distinct stop / route relationships
	 * -----------------------------------------------------------------------
	 *
	 * A stop can appear in many rides because:
	 *
	 *   - multiple rides can use the same hashed trip
	 *   - multiple hashed trips can use the same shape
	 *   - a route can have multiple shapes
	 *
	 * DISTINCT removes duplicate occurrences while preserving different
	 * route/shape combinations.
	 *
	 * route_shape_id is intentionally included because the API needs to
	 * distinguish different patterns of the same route.
	 */
	stop_routes AS
	(
		SELECT DISTINCT
			ht.stop_id,
			ht.stop_lat,
			ht.stop_lon,
			ht.stop_name,

			r.route_long_name,
			r.shape_id AS route_shape_id,
			r.route_short_name

		FROM hashed_trips_latest AS ht

		INNER JOIN rides_latest AS r
			ON
				r.hashed_trip_id = ht._id
	)

/*
 * -------------------------------------------------------------------------
 * Final stop result
 * -------------------------------------------------------------------------
 *
 * One row per stop.
 *
 * routes contains the distinct route/shape combinations that serve the
 * stop through at least one ride in the requested time range.
 */
SELECT
	stop_id,

	any(stop_lat) AS stop_lat,
	any(stop_lon) AS stop_lon,
	any(stop_name) AS stop_name,

	groupArray(
		(
			route_long_name,
			route_shape_id,
			route_short_name
		)
	) AS routes

FROM stop_routes

GROUP BY
	stop_id

ORDER BY
	stop_name ASC;
`;
