-- Delete orphan rows from eta.hist_node_travel_times.
--
-- An "orphan" row is any record whose `ride_id` no longer exists in
-- eta.hist_rides. Once the historical rides cleanup has pruned stale
-- rides, every hist_node_travel_times row referencing one of those
-- gone rides becomes an orphan and should be removed.
--
-- Preview the number of orphan rows that will be deleted:

SELECT count() AS rows_to_delete FROM eta.hist_node_travel_times
WHERE ride_id NOT IN (
    SELECT DISTINCT _id FROM eta.hist_rides
);

-- Delete all orphan rows from eta.hist_node_travel_times:

ALTER TABLE eta.hist_node_travel_times
DELETE WHERE ride_id NOT IN (
    SELECT DISTINCT _id FROM eta.hist_rides
);
