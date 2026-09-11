-- Delete out-of-window or orphan vehicle events from eta.curr_vehicle_events.
--
-- This script deletes current vehicle events that:
--   1. Have a `created_at` timestamp older than now() - window_hours_before hours
--   2. Or whose (trip_id, hashed_shape_id) pair no longer exists in eta.curr_rides.
--
-- Parameters:
--   {window_hours_before:UInt32} = hours before now for lower boundary
--
-- Preview the number of vehicle events that will be deleted:

SELECT count() AS rows_to_delete FROM eta.curr_vehicle_events
WHERE
    created_at < toUInt64(toUnixTimestamp64Milli(now64(3))) - (toUInt64({window_hours_before:UInt32}) * 60 * 60 * 1000)
    OR (trip_id, hashed_shape_id) NOT IN (
        SELECT DISTINCT
            trip_id,
            hashed_shape_id
        FROM eta.curr_rides
    );

-- Delete all out-of-window or orphan vehicle events from eta.curr_vehicle_events:

ALTER TABLE eta.curr_vehicle_events
DELETE WHERE
    created_at < toUInt64(toUnixTimestamp64Milli(now64(3))) - (toUInt64({window_hours_before:UInt32}) * 60 * 60 * 1000)
    OR (trip_id, hashed_shape_id) NOT IN (
        SELECT DISTINCT
            trip_id,
            hashed_shape_id
        FROM eta.curr_rides
    );
