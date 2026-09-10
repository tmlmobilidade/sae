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
	WHERE _id = $hashed_trip_id
	ORDER BY updated_at DESC
	LIMIT 1 BY _id, stop_sequence
)
ORDER BY stop_sequence
