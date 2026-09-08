/* * */

export const findTripIdQuery = `
	WITH
		rides_latest AS (
			SELECT
				_id,
				hashed_trip_id,
				trip_id
			FROM operation.rides
			WHERE
				agency_id = $1
				AND start_time_scheduled = $2
			ORDER BY
				updated_at DESC
			LIMIT 1 BY _id
		),
		trip_stops AS (
			SELECT
				_id,
				argMin(stop_id, stop_sequence) AS first_stop_id,
				argMax(stop_id, stop_sequence) AS last_stop_id
			FROM (
				SELECT
					_id,
					stop_id,
					stop_sequence
				FROM operation.hashed_trips
				WHERE _id IN (SELECT hashed_trip_id FROM rides_latest)
				ORDER BY
					updated_at DESC
				LIMIT 1 BY _id, stop_sequence
			)
			GROUP BY _id
		)
	SELECT
		r.trip_id
	FROM rides_latest AS r
	INNER JOIN trip_stops AS t ON r.hashed_trip_id = t._id
	WHERE
		t.first_stop_id = $3
		AND t.last_stop_id = $4
`;
