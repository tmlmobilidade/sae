-- Replay variant of eta.mv_curr_vehicle_events.
-- Inserts a single snapped row into eta.curr_vehicle_events for the
-- vehicle event identified by `{event_id:String}` (scoped to `{trip_id:String}`).
--
-- Mirrors the MV defined in bootstrap/mv-sync-curr-vehicle-events.sql, but
-- avoids relying on the live insert trigger so historical replays can drive the
-- pipeline deterministically. Depends on eta.curr_rides and
-- eta.hist_shape_nodes being already populated by the loader.

INSERT INTO eta.curr_vehicle_events
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
WHERE s._id = {event_id:String}
  AND s.trip_id = {trip_id:String}
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
