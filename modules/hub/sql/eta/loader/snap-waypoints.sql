-- =============================================================================
-- Snaps every daily waypoint stop to the nearest node on its trip's shape.
-- Source: eta.curr_waypoints (stop lat/lon)
--         eta.daily_rides           (trip -> hashed_shape_id assignment)
--         eta.shape_nodes           (per-shape node geometry)
-- Target: eta.curr_waypoints_snapped
--
-- Run once per day, AFTER daily_rides + daily_rides_waypoints + shape_nodes
-- have been refreshed for the new operational date. The snapped table feeds
-- eta.mv_live_trip_stop_etas so live ETAs can resolve stop -> node_index in O(1).
-- =============================================================================

INSERT INTO eta.curr_waypoints_snapped
SELECT
    w._id                                                               AS hashed_trip_id,
    d.hashed_shape_id                                                   AS hashed_shape_id,
    w.stop_sequence                                                     AS stop_sequence,
    w.stop_id                                                           AS stop_id,
    w.stop_name                                                         AS stop_name,
    w.stop_lat                                                          AS stop_lat,
    w.stop_lon                                                          AS stop_lon,
    -- Nearest node on the trip's shape (same snap pattern used by mv_live_snapper
    -- and pipeline/1-transformation-pipeline.sql for raw vehicle events).
    argMin(n.node_index,
           greatCircleDistance(w.stop_lon, w.stop_lat, n.longitude, n.latitude)) AS node_index,
    w.arrival_time                                                      AS arrival_time,
    w.departure_time                                                    AS departure_time
FROM eta.curr_waypoints AS w
INNER JOIN eta.curr_rides     AS d ON w._id = d.hashed_trip_id
INNER JOIN eta.hist_shape_nodes     AS n ON d.hashed_shape_id = n.hashed_shape_id
GROUP BY
    w._id,
    d.hashed_shape_id,
    w.stop_sequence,
    w.stop_id,
    w.stop_name,
    w.stop_lat,
    w.stop_lon,
    w.arrival_time,
    w.departure_time;
