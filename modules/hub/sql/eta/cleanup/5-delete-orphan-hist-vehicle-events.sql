-- Delete orphan vehicle events from eta.hist_vehicle_events.
--
-- An "orphan" event is any record whose `ride_id` no longer exists in
-- eta.hist_rides. Once the historical rides cleanup has pruned stale
-- rides, every hist_vehicle_events row referencing one of those gone
-- rides becomes an orphan and should be removed.
--
-- Preview the number of orphan vehicle events that will be deleted:

SELECT count() AS rows_to_delete FROM eta.hist_vehicle_events
WHERE ride_id NOT IN (
    SELECT DISTINCT _id FROM eta.hist_rides
);

-- Delete all orphan vehicle events from eta.hist_vehicle_events:

ALTER TABLE eta.hist_vehicle_events
DELETE WHERE ride_id NOT IN (
    SELECT DISTINCT _id FROM eta.hist_rides
);
