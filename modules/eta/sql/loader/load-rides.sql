-- Current window rides: operation.rides + hashed_shapes + hashed_trips first/last stops → eta.curr_rides.
-- first/last geohash columns use table DEFAULTs (omit from insert column list).
--
-- Params:
--   agency_ids            comma-separated agency_id list
--   line_ids              comma-separated route_short_name list (empty = no line filter)
--   time_start/time_end   unix ms bounds on start_time_scheduled

INSERT INTO eta.{table_name:Identifier} (
    _id,
    agency_code,
    agency_id,
    direction_id,
    driver_ids,
    end_time_observed,
    end_time_scheduled,
    hashed_trip_id,
    headsign,
    operational_date,
    plan_id,
    route_id,
    route_long_name,
    route_short_name,
    seen_first_at,
    seen_last_at,
    shape_id,
    shape_polyline,
    start_time_observed,
    start_time_scheduled,
    trip_id,
    updated_at,
    vehicle_ids,
    hashed_shape_id,
    first_stop_id,
    first_stop_name,
    first_stop_coordinates,
    last_stop_id,
    last_stop_name,
    last_stop_coordinates
)
WITH
    matched_rides AS (
        SELECT
            _id,
            agency_code,
            agency_id,
            toFixedString(toString(direction_id), 1) AS direction_id,
            driver_ids,
            end_time_observed,
            end_time_scheduled,
            hashed_trip_id,
            headsign,
            toUInt32(operational_date) AS operational_date,
            plan_id,
            route_id,
            route_long_name,
            route_short_name,
            seen_first_at,
            seen_last_at,
            shape_id,
            hashed_shape_id,
            start_time_observed,
            start_time_scheduled,
            trip_id,
            updated_at,
            vehicle_ids
        FROM operation.rides FINAL
        WHERE
            has(splitByChar(',', $agency_ids), agency_id)
            AND ($line_ids = '' OR has(splitByChar(',', $line_ids), route_short_name))
            AND start_time_scheduled >= $time_start
            AND start_time_scheduled <= $time_end
    ),
    trip_stops AS (
        SELECT
            _id AS hashed_trip_id,
            argMin(stop_id, stop_sequence) AS first_stop_id,
            argMin(stop_name, stop_sequence) AS first_stop_name,
            argMin(stop_lat, stop_sequence) AS first_stop_lat,
            argMin(stop_lon, stop_sequence) AS first_stop_lon,
            argMax(stop_id, stop_sequence) AS last_stop_id,
            argMax(stop_name, stop_sequence) AS last_stop_name,
            argMax(stop_lat, stop_sequence) AS last_stop_lat,
            argMax(stop_lon, stop_sequence) AS last_stop_lon
        FROM operation.hashed_trips FINAL
        WHERE _id IN (SELECT hashed_trip_id FROM matched_rides)
        GROUP BY _id
    ),
    hashed_shapes AS (
        SELECT
            _id AS hashed_shape_id,
            shape_polyline
        FROM operation.hashed_shapes FINAL
        WHERE _id IN (SELECT hashed_shape_id FROM matched_rides)
    )
SELECT
    r._id,
    r.agency_code,
    r.agency_id,
    r.direction_id,
    r.driver_ids,
    r.end_time_observed,
    r.end_time_scheduled,
    r.hashed_trip_id,
    r.headsign,
    r.operational_date,
    r.plan_id,
    r.route_id,
    r.route_long_name,
    r.route_short_name,
    r.seen_first_at,
    r.seen_last_at,
    r.shape_id,
    s.shape_polyline,
    r.start_time_observed,
    r.start_time_scheduled,
    r.trip_id,
    r.updated_at,
    r.vehicle_ids,
    r.hashed_shape_id,
    t.first_stop_id,
    t.first_stop_name,
    (toFloat64(t.first_stop_lat), toFloat64(t.first_stop_lon)) AS first_stop_coordinates,
    t.last_stop_id,
    t.last_stop_name,
    (toFloat64(t.last_stop_lat), toFloat64(t.last_stop_lon)) AS last_stop_coordinates
FROM matched_rides AS r
INNER JOIN trip_stops AS t ON r.hashed_trip_id = t.hashed_trip_id
INNER JOIN hashed_shapes AS s ON r.hashed_shape_id = s.hashed_shape_id;
