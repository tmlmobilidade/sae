WITH latest_events AS (
			SELECT
				_id,
				agency_id,
				vehicle_id,
				created_at,
				current_status,
				geohash,
				latitude,
				longitude,
				received_at,
				speed,
				stop_id,
				trip_id,
				bearing
			FROM operation.simplified_vehicle_events
			WHERE created_at > toUnixTimestamp64Milli(now64(3) - INTERVAL 90 SECOND)
			ORDER BY created_at DESC
			LIMIT 2 BY agency_id, vehicle_id
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
					toUnixTimestamp64Milli(now64(3) - INTERVAL 10 HOUR)
					AND toUnixTimestamp64Milli(now64(3) + INTERVAL 10 HOUR)
				AND trip_id IN (
					SELECT trip_id
					FROM latest_events
					WHERE trip_id != ''
				)
			ORDER BY updated_at DESC
			LIMIT 1 BY _id
		)

		SELECT
			sve._id,
			sve.created_at,
			sve.agency_id,
			sve.latitude,
			sve.longitude,
			sve.received_at,
			sve.trip_id,
			sve.vehicle_id,
			sve.stop_id,
			sve.bearing,
			sve.current_status,
			sve.geohash,
			sve.speed,
			r.direction_id,
			r.route_id,
			r.plan_id,
			r.operational_date,
			r.route_short_name,
			r.shape_id,
			r._id AS ride_id
		FROM latest_events AS sve
		INNER JOIN associated_rides AS r
			ON r.agency_id = sve.agency_id
			AND r.trip_id = sve.trip_id
			AND r.start_time_scheduled BETWEEN
				sve.created_at - 36000000
				AND sve.created_at + 36000000;