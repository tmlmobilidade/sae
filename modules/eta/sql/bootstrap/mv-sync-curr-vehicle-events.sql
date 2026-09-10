-- Live vehicle positions and snapper MV.
-- Depends: eta.curr_rides, eta.hist_shape_nodes; source operation.simplified_vehicle_events.

CREATE TABLE IF NOT EXISTS eta.curr_vehicle_events
(
    _id String,
    agency_id String,
    trip_id String,
    vehicle_id String,
    hashed_shape_id String,
    node_index UInt32,
    latitude Float64,
    longitude Float64,
    speed Nullable(Int64),
    bearing Nullable(Int64),
    created_at Int64,
    received_at Int64
)
ENGINE = ReplacingMergeTree()
ORDER BY (created_at, vehicle_id, trip_id, _id);

-- Snaps each ingested vehicle event to the closest shape node per trip (trip->shape from daily_rides).
--
-- Refreshable (batched) instead of an insert-triggered MV: the tracker streams
-- flush ~6 small inserts/s, and an insert-triggered MV rebuilds the join hash
-- tables for curr_rides and hist_shape_nodes on every one of them. Batching
-- every 5s builds them once per batch.
--
-- Each refresh takes events received after the newest one already snapped,
-- minus a 60s overlap: the 20 tracker streams insert independently, so an
-- event can land in ClickHouse after a newer one was already processed. The
-- overlap is deduped on _id. The 10-minute floor bounds the catch-up work
-- after a bootstrap or a refresh outage.
CREATE OR REPLACE MATERIALIZED VIEW eta.mv_curr_vehicle_events
REFRESH EVERY 5 SECOND APPEND TO eta.curr_vehicle_events AS
WITH
    since AS (
        SELECT greatest(max(received_at), toUnixTimestamp64Milli(now64(3)) - 10 * 60 * 1000) - 60 * 1000 AS ms
        FROM eta.curr_vehicle_events
    )
SELECT
    s._id AS _id,
    s.agency_id AS agency_id,
    s.trip_id AS trip_id,
    s.vehicle_id AS vehicle_id,
    d.hashed_shape_id AS hashed_shape_id,
    argMin(n.node_index, greatCircleDistance(s.longitude, s.latitude, n.longitude, n.latitude)) AS node_index,
    s.latitude AS latitude,
    s.longitude AS longitude,
    s.speed AS speed,
    s.bearing AS bearing,
    s.created_at AS created_at,
    s.received_at AS received_at
FROM operation.simplified_vehicle_events AS s
INNER JOIN eta.curr_rides AS d ON s.trip_id = d.trip_id
INNER JOIN eta.hist_shape_nodes AS n ON d.hashed_shape_id = n.hashed_shape_id
-- operational_date is in the partition/primary key: prunes the scan to the current day(s).
WHERE s.operational_date >= toYYYYMMDD(today() - 1)
  AND s.received_at > (SELECT ms FROM since)
  AND s._id NOT IN (SELECT _id FROM eta.curr_vehicle_events WHERE received_at > (SELECT ms FROM since))
GROUP BY
    s._id,
    s.agency_id,
    s.trip_id,
    s.vehicle_id,
    d.hashed_shape_id,
    s.latitude,
    s.longitude,
    s.speed,
    s.bearing,
    s.created_at,
    s.received_at;
