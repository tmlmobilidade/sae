/* * */

export const fetchRidesReferenceContextQuery = `
WITH

	/*
	 * -----------------------------------------------------------------------
	 * Latest ride versions
	 * -----------------------------------------------------------------------
	 *
	 * Rides use ReplacingMergeTree(updated_at), so explicitly select the
	 * latest version of each ride.
	 */
	rides_latest AS
	(
		SELECT
			_id,
			headsign,
			route_short_name,
			start_time_scheduled,
			updated_at

		FROM operation.rides

		WHERE
			agency_id = $1
			AND start_time_scheduled >= $2
			AND start_time_scheduled <= $3
			AND _id IN ($4)

		ORDER BY
			updated_at DESC

		LIMIT 1 BY _id
	)

/*
 * -------------------------------------------------------------------------
 * Final result
 * -------------------------------------------------------------------------
 */
SELECT
	headsign,
	route_short_name,
	start_time_scheduled

FROM rides_latest

ORDER BY
	start_time_scheduled ASC,
	_id ASC;
`;
