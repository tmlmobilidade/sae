/* * */

export const alertsLinesQuery = `
WITH

	/*
	 * -----------------------------------------------------------------------
	 * Latest Ride versions
	 * -----------------------------------------------------------------------
	 *
	 * Only rides for the requested agency and scheduled time range are
	 * relevant.
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
	 * Distinct patterns
	 * -----------------------------------------------------------------------
	 *
	 * A pattern is identified by:
	 *
	 *   route_short_name
	 *   route_id
	 *   headsign
	 *   shape_id
	 *
	 * A route can have multiple patterns, e.g.:
	 *
	 *   3001_0 / Almada - Cacilhas / shape_a
	 *   3001_1 / Almada - Cacilhas / shape_b
	 *
	 * Only patterns that have at least one Ride in the requested time range
	 * are included.
	 */
	patterns AS
	(
		SELECT DISTINCT
			agency_id,
			route_short_name,
			route_id,
			headsign,
			shape_id
		FROM rides_latest
	),

	/*
	 * -----------------------------------------------------------------------
	 * Latest hashed trip stop versions
	 * -----------------------------------------------------------------------
	 *
	 * hashed_trips uses ReplacingMergeTree(updated_at).
	 *
	 * The primary key is (_id, stop_sequence), so select the latest version
	 * for each stop of each hashed trip.
	 */
	hashed_trips_latest AS
	(
		SELECT
			*
		FROM operation.hashed_trips
		WHERE
			agency_id = $1
		ORDER BY
			updated_at DESC
		LIMIT 1 BY _id, stop_sequence
	),

	/*
	 * -----------------------------------------------------------------------
	 * Pattern stops
	 * -----------------------------------------------------------------------
	 *
	 * Build the ordered stop list for each shape.
	 *
	 * shape_id is used to connect a Ride pattern to its path in hashed_trips.
	 */
	pattern_stops AS
	(
		SELECT
			agency_id,
			shape_id,

			arrayMap(
				stop ->
					(
						stop.2,
						stop.3
					),
				arraySort(
					stop ->
						stop.1,
					arrayDistinct(
						groupArray(
							(
								stop_sequence,
								stop_id,
								stop_name
							)
						)
					)
				)
			) AS stops

		FROM hashed_trips_latest

		WHERE
			shape_id IN (
				SELECT DISTINCT shape_id
				FROM patterns
			)

		GROUP BY
			agency_id,
			shape_id
	),

	/*
	 * -----------------------------------------------------------------------
	 * Route information
	 * -----------------------------------------------------------------------
	 *
	 * The base route is the route with the lowest route_id for each
	 * route_short_name.
	 *
	 * argMin() guarantees that route_long_name comes from that same row.
	 */
	route_information AS
	(
		SELECT
			agency_id,
			route_short_name,

			argMin(
				route_long_name,
				route_id
			) AS route_long_name

		FROM rides_latest

		GROUP BY
			agency_id,
			route_short_name
	),

	/*
	 * -----------------------------------------------------------------------
	 * Patterns with stops
	 * -----------------------------------------------------------------------
	 */
	patterns_with_stops AS
	(
		SELECT
			p.agency_id,
			p.route_short_name,
			p.route_id,
			p.headsign,
			p.shape_id,
			s.stops

		FROM patterns AS p

		LEFT JOIN pattern_stops AS s
			ON
				s.agency_id = p.agency_id
				AND s.shape_id = p.shape_id
	)

/*
 * -------------------------------------------------------------------------
 * Final line result
 * -------------------------------------------------------------------------
 *
 * One row per route_short_name.
 *
 * patterns contains all distinct operating patterns for that line.
 */
SELECT
	r.agency_id,

	groupArray(
		(
			p.headsign,
			p.route_id,
			p.shape_id,
			p.stops
		)
	) AS patterns,

	r.route_long_name,
	r.route_short_name

FROM route_information AS r

INNER JOIN patterns_with_stops AS p
	ON
		p.agency_id = r.agency_id
		AND p.route_short_name = r.route_short_name

GROUP BY
	r.agency_id,
	r.route_long_name,
	r.route_short_name

ORDER BY
	r.route_short_name ASC;
`;
