/* * */

export const findRidesForTrainQuery = `
	WITH rides_latest AS (
		SELECT
			_id,
			hashed_shape_id,
			hashed_trip_id,
			start_time_scheduled,
			trip_id
		FROM operation.rides
		WHERE
			agency_id = $1
			AND headsign = $2
			AND start_time_scheduled BETWEEN $3 AND $4
		ORDER BY updated_at DESC
		LIMIT 1 BY _id
	)
	SELECT
		_id,
		hashed_shape_id,
		hashed_trip_id,
		trip_id
	FROM rides_latest
	ORDER BY start_time_scheduled
`;

export const findHashedTripQuery = `
	SELECT
		_id,
		agency_id,
		arrival_time,
		departure_time,
		drop_off_type,
		pickup_type,
		shape_dist_traveled,
		shape_id,
		stop_id,
		stop_lat,
		stop_lon,
		stop_name,
		stop_sequence,
		timepoint,
		updated_at
	FROM (
		SELECT *
		FROM operation.hashed_trips
		WHERE _id = $1
		ORDER BY updated_at DESC
		LIMIT 1 BY _id, stop_sequence
	)
	ORDER BY stop_sequence
`;

export const findHashedShapeQuery = `
	SELECT
		shape_polyline
	FROM (
		SELECT *
		FROM operation.hashed_shapes
		WHERE _id = $1
		ORDER BY updated_at DESC
		LIMIT 1 BY _id
	)
`;
