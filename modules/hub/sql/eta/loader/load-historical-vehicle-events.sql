-- Historical vehicle events: operation.simplified_vehicle_events → eta.hist_vehicle_events.
--
-- Source table ORDER BY (operational_date, trip_id, vehicle_id, agency_id, created_at).
-- Filters use that prefix (operational_date + trip_id) before the ride window join so
-- ClickHouse can prune granules instead of scanning by created_at alone.

INSERT INTO eta.hist_vehicle_events (
    _id,
    agency_id,
    bearing,
    created_at,
    current_status,
    driver_id,
    extra_trip_id,
    latitude,
    longitude,
    odometer,
    operational_date,
    received_at,
    speed,
    stop_id,
    trip_id,
    vehicle_id,
    ride_id,
    hashed_shape_id
)
WITH
    rides AS (
        SELECT
            _id AS ride_id,
            trip_id,
            hashed_shape_id,
            greatest(start_time_observed, start_time_scheduled) AS ride_start,
            end_time_observed AS ride_end
        FROM eta.hist_rides
        WHERE
            end_time_observed >= $chunk_start
            AND greatest(start_time_observed, start_time_scheduled) < $chunk_end
    ),
    existing_ids AS (
        SELECT _id
        FROM eta.hist_vehicle_events
        WHERE
            created_at >= $chunk_start
            AND created_at < $chunk_end
    )
SELECT
    sve._id,
    sve.agency_id,
    sve.bearing,
    sve.created_at,
    sve.current_status,
    sve.driver_id,
    sve.extra_trip_id,
    sve.latitude,
    sve.longitude,
    sve.odometer,
    sve.operational_date,
    sve.received_at,
    sve.speed,
    sve.stop_id,
    sve.trip_id,
    sve.vehicle_id,
    hr.ride_id,
    hr.hashed_shape_id
FROM operation.simplified_vehicle_events AS sve
INNER JOIN rides AS hr
    ON sve.trip_id = hr.trip_id
WHERE
    sve.created_at >= $chunk_start
    AND sve.created_at < $chunk_end
    AND sve.created_at >= hr.ride_start
    AND sve.created_at <= hr.ride_end
    AND NOT EXISTS (
        SELECT 1
        FROM existing_ids AS e
        WHERE e._id = sve._id
    )
SETTINGS join_algorithm = 'auto';
