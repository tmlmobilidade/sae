WITH rides_latest AS (
	SELECT
		_id,
		hashed_shape_id,
		hashed_trip_id,
		start_time_scheduled,
		trip_id
	FROM operation.rides
	WHERE
		agency_id = $agency_id
		AND headsign = $headsign
		AND start_time_scheduled BETWEEN $start_time_scheduled_min AND $start_time_scheduled_max
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
