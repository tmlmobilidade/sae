-- Current window waypoints: operation.hashed_trips for trips in eta.curr_rides → eta.curr_waypoints.

INSERT INTO eta.curr_waypoints (
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
)
SELECT
    h._id,
    h.agency_id,
    h.arrival_time,
    h.departure_time,
    h.drop_off_type,
    h.pickup_type,
    h.shape_dist_traveled,
    h.shape_id,
    h.stop_id,
    h.stop_lat,
    h.stop_lon,
    h.stop_name,
    h.stop_sequence,
    h.timepoint,
    h.updated_at
FROM operation.hashed_trips AS h FINAL
INNER JOIN eta.curr_rides AS r ON h._id = r.hashed_trip_id;
