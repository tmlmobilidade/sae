-- Delete out-of-window historical rides from eta.hist_rides.
--
-- The cleaner mirrors the loader's historical window: rides from
-- `operation.rides` whose `start_time_scheduled` falls inside
-- `[now − historicalDataDaysBack − standardWindowHours, now − standardWindowHours]`.
-- Those `_id` values are the set currently considered in-window.
--
-- That set is staged (by the cleaner task) into
-- `eta._cleaner_hist_rides_keep`, a small MergeTree table that is
-- truncated and repopulated every run. We reference it as a subquery here
-- instead of binding the ids via `query_params`, because the URL-encoded
-- ClickHouse HTTP parameter list overflows for large keep sets
-- ("HTTP request URI invalid or too long").
--
-- Preview the number of historical rides that will be deleted:

SELECT count() AS rows_to_delete FROM eta.hist_rides
WHERE _id NOT IN (
    SELECT _id FROM eta._cleaner_hist_rides_keep
);

-- Delete all out-of-window historical rides from eta.hist_rides:

ALTER TABLE eta.hist_rides
DELETE WHERE _id NOT IN (
    SELECT _id FROM eta._cleaner_hist_rides_keep
);
