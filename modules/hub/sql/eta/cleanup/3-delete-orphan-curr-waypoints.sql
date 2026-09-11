-- Delete orphan waypoints from eta.curr_waypoints.
-- An "orphan" waypoint is any record whose `_id` (hashed trip id) no longer
-- exists as `hashed_trip_id` in eta.curr_rides. curr_waypoints is cloned from
-- operation.hashed_trips, so the trip key column is `_id`.

-- Preview the number of orphan waypoints that will be deleted:
SELECT count() AS rows_to_delete FROM eta.curr_waypoints
WHERE
    _id NOT IN (
        SELECT DISTINCT hashed_trip_id
        FROM eta.curr_rides
    );

-- Delete all orphan waypoints from eta.curr_waypoints:
ALTER TABLE eta.curr_waypoints
DELETE WHERE _id NOT IN (
	SELECT DISTINCT hashed_trip_id
	FROM eta.curr_rides
);
