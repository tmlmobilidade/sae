/* * */

export const fetchLinesReferenceContextQuery = `
WITH

	/*
	 * -----------------------------------------------------------------------
	 * Latest ride versions
	 * -----------------------------------------------------------------------
	 *
	 * Only rides for the requested agency, time range and route names are
	 * relevant.
	 *
	 * Rides use ReplacingMergeTree(updated_at), so explicitly select the
	 * latest version instead of using FINAL.
	 */
	rides_latest AS
	(
		SELECT
			_id,
			route_short_name,
			route_long_name,
			updated_at

		FROM operation.rides

		WHERE
			agency_id = $1
			AND start_time_scheduled >= $2
			AND start_time_scheduled <= $3
			AND route_short_name IN $4

		ORDER BY
			updated_at DESC

		LIMIT 1 BY _id
	)

/*
 * -------------------------------------------------------------------------
 * Final route result
 * -------------------------------------------------------------------------
 *
 * A route can have many rides, so return one row per route_short_name.
 */
SELECT
	route_short_name,
	argMax(route_long_name, updated_at) AS route_long_name

FROM rides_latest

GROUP BY
	route_short_name

ORDER BY
	route_short_name ASC;
`;
