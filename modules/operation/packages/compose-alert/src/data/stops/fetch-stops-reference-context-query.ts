/* * */

export const fetchStopsReferenceContextQuery = `
WITH

	/*
	 * -----------------------------------------------------------------------
	 * Latest rides in the requested interval
	 * -----------------------------------------------------------------------
	 *
	 * Only hashed trips referenced by rides in the requested time range
	 * are relevant.
	 */
	rides_latest AS
	(
		SELECT
			_id,
			hashed_trip_id,
			updated_at

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
	 * Only stops requested by the caller are considered.
	 */
	hashed_trips_latest AS
	(
		SELECT
			_id,
			stop_id,
			stop_name,
			updated_at

		FROM operation.hashed_trips

		WHERE
			agency_id = $1
			AND _id IN (
				SELECT
					hashed_trip_id
				FROM relevant_hashed_trip_ids
			)
			AND stop_id IN $4

		ORDER BY
			updated_at DESC

		LIMIT 1 BY _id, stop_sequence
	)

/*
 * -------------------------------------------------------------------------
 * Final stop result
 * -------------------------------------------------------------------------
 *
 * Return exactly one stop name per stop_id.
 */
SELECT
	stop_id,
	argMax(stop_name, updated_at) AS stop_name

FROM hashed_trips_latest

GROUP BY
	stop_id

ORDER BY
	stop_id ASC;
`;
