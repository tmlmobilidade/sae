WITH latest_events AS (
	SELECT *
	FROM (
		SELECT
			* REPLACE(
				coalesce(
					bearing,
					if(
						lagInFrame(created_at) OVER w IS NOT NULL
						AND (created_at - lagInFrame(created_at) OVER w) <= (toInt64($bearingInferenceLookbackSeconds) * 1000)
						AND (
							abs(latitude - lagInFrame(latitude) OVER w) > 0.000001
							OR abs(longitude - lagInFrame(longitude) OVER w) > 0.000001
						),
						toInt64(
							round(
								mod(
									360 + degrees(
										atan2(
											sin(radians(longitude- lagInFrame(longitude) OVER w)) * cos(radians(latitude)),
											cos(radians(lagInFrame(latitude) OVER w))
												* sin(radians(latitude)) - sin(radians(lagInFrame(latitude) OVER w))
												* cos(radians(latitude))
												* cos(radians(longitude- lagInFrame(longitude) OVER w))
										)
									),
									360
								)
							)
						),
						NULL
					)
				) AS bearing
			)
		FROM operation.simplified_vehicle_events
		WHERE created_at > toUnixTimestamp64Milli(
			now64(3)
			- INTERVAL $secondsAgo SECOND
			- INTERVAL $bearingInferenceLookbackSeconds SECOND
		)
		WINDOW w AS (
			PARTITION BY agency_id, vehicle_id
			ORDER BY created_at
		)
	)
	WHERE created_at > toUnixTimestamp64Milli(now64(3) - INTERVAL $secondsAgo SECOND)
	ORDER BY created_at DESC
	LIMIT 1 BY agency_id, vehicle_id
),

associated_rides AS (
	SELECT
		_id,
		agency_id,
		direction_id,
		operational_date,
		plan_id,
		route_id,
		route_short_name,
		shape_id,
		start_time_scheduled,
		trip_id
	FROM operation.rides
	WHERE
		start_time_scheduled BETWEEN
			toUnixTimestamp64Milli(now64(3) - INTERVAL $stdWindowHours HOUR)
			AND toUnixTimestamp64Milli(now64(3) + INTERVAL $stdWindowHours HOUR)
		AND trip_id IN (
			SELECT trip_id
			FROM latest_events
			WHERE trip_id != ''
		)
	ORDER BY updated_at DESC
	LIMIT 1 BY _id
)

SELECT
	e._id,
	e.created_at,
	e.agency_id,
	e.latitude,
	e.longitude,
	e.operational_date,
	e.received_at,
	if(empty(r.plan_id), '', concat('[', r.plan_id, ']', '[', e.agency_id, ']', e.trip_id)) AS trip_id,
	concat('[', e.agency_id, ']', e.vehicle_id) AS vehicle_id,
	e.stop_id,
	toInt8OrNull(r.direction_id) AS direction_id,
	r.route_id,
	nullIf(r.route_short_name, '') AS route_short_name,
	e.bearing,
	e.current_status,
	geohashEncode(e.longitude, e.latitude, 7) AS geohash,
	nullIf(r.shape_id, '') AS shape_id,
	r._id AS ride_id,
	e.speed
FROM latest_events AS e
LEFT JOIN associated_rides AS r
	ON r.agency_id = e.agency_id
	AND r.trip_id = e.trip_id
	AND r.start_time_scheduled BETWEEN
		e.created_at - 36000000
		AND e.created_at + 36000000
