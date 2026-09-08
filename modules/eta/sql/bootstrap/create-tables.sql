TRUNCATE DATABASE eta;

-- ========================
-- Historical Rides
-- ========================

CREATE TABLE IF NOT EXISTS eta.hist_rides
AS operation.rides;

ALTER TABLE eta.hist_rides
ADD COLUMN shape_polyline String CODEC(ZSTD),
ADD COLUMN first_stop_id String,
ADD COLUMN first_stop_name String,
ADD COLUMN first_stop_coordinates Tuple(Float64, Float64),
ADD COLUMN first_stop_geohash String DEFAULT geohashEncode(first_stop_coordinates.2, first_stop_coordinates.1, 7),
ADD COLUMN last_stop_id String,
ADD COLUMN last_stop_name String,
ADD COLUMN last_stop_coordinates Tuple(Float64, Float64),
ADD COLUMN last_stop_geohash String DEFAULT geohashEncode(last_stop_coordinates.2, last_stop_coordinates.1, 7);

-- ========================
-- Current Rides
-- ========================
CREATE TABLE IF NOT EXISTS eta.curr_rides
AS eta.hist_rides;

-- ========================
-- Historical Vehicle Events
-- ========================
CREATE TABLE IF NOT EXISTS eta.hist_vehicle_events
AS operation.simplified_vehicle_events;

ALTER TABLE eta.hist_vehicle_events
ADD COLUMN ride_id String,
ADD COLUMN hashed_shape_id String;

-- ========================
-- Historical Shape Nodes
-- ========================
CREATE TABLE IF NOT EXISTS eta.hist_shape_nodes (
    hashed_shape_id String,
    node_index UInt32,
    latitude Float64,
    longitude Float64,
    geohash String,
    INDEX idx_geohash geohash TYPE bloom_filter GRANULARITY 1,
)
ENGINE = ReplacingMergeTree()
ORDER BY (geohash, hashed_shape_id, node_index);

-- =============================================================================
-- Node travel times transformation outputs
-- =============================================================================

CREATE TABLE IF NOT EXISTS eta.hist_node_travel_times (
    event_id String,
    ride_id String,
    hashed_shape_id String,
    node_index UInt32,
    hour UInt8,
    created_at UInt64,
    travel_time_seconds UInt32,
    speed_kmh Float64,
    latitude Float64,
    longitude Float64,
    -- The per-day aggregation query filters by created_at alone; see
    -- hist_vehicle_events.idx_created_at for rationale.
    INDEX idx_created_at created_at TYPE minmax GRANULARITY 1
)
ENGINE = ReplacingMergeTree()
ORDER BY (ride_id, hashed_shape_id, node_index, hour, created_at);


CREATE TABLE IF NOT EXISTS eta.hist_node_travel_times_aggregation (
    hashed_shape_id String,
    node_index UInt32,
    operational_date UInt32,
    period_of_day Enum8('Peak AM' = 1, 'Mid' = 2, 'Peak PM' = 3, 'Off Peak' = 4),
    weekday Enum8('Monday' = 1, 'Tuesday' = 2, 'Wednesday' = 3, 'Thursday' = 4, 'Friday' = 5, 'Saturday' = 6, 'Sunday' = 7),
    day_type Enum8('Weekday' = 1, 'Weekend' = 2),
    avg_travel_time_seconds Float64,
    min_travel_time_seconds Float64,
    max_travel_time_seconds Float64,
    median_travel_time_seconds Float64,
    inserted_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(inserted_at)
ORDER BY
    (hashed_shape_id, node_index, operational_date, period_of_day, weekday, day_type);

-- ========================
-- Current Waypoints
-- ========================

CREATE TABLE IF NOT EXISTS eta.curr_waypoints
as operation.hashed_trips;

-- Snapped waypoints: every stop on a trip resolved to its nearest shape node.
CREATE TABLE IF NOT EXISTS eta.curr_waypoints_snapped
(
    hashed_trip_id String,
    hashed_shape_id String,
    stop_sequence UInt16,
    stop_id String,
    stop_name String,
    stop_lat Float64,
    stop_lon Float64,
    node_index UInt32,
    arrival_time String,
    departure_time String
)
ENGINE = ReplacingMergeTree()
ORDER BY (hashed_trip_id, stop_sequence, stop_id);