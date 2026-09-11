-- Delete out-of-window rows from eta.hist_node_travel_times_aggregation.
--
-- The loader's aggregation step (3-aggregate_hist_node_travel_times.sql)
-- inserts rows for the last `historicalDataDaysBack` days every run, so
-- without cleanup the table accumulates stale aggregations indefinitely.
-- Drop everything whose `operational_date` (UInt32 YYYYMMDD) falls
-- before today minus the configured window.
--
-- `operational_date` is built from `fromUnixTimestamp64Milli(created_at)`
-- in the loader (server TZ), so we compare against `today()` here for
-- consistency.
--
-- Parameters:
--   {historical_data_days_back:UInt32} = days kept relative to today
--
-- Preview the number of rows that will be deleted:

SELECT count() AS rows_to_delete FROM eta.hist_node_travel_times_aggregation
WHERE operational_date < toYYYYMMDD(subtractDays(today(), {historical_data_days_back:UInt32}));

-- Delete all out-of-window rows from eta.hist_node_travel_times_aggregation:

ALTER TABLE eta.hist_node_travel_times_aggregation
DELETE WHERE operational_date < toYYYYMMDD(subtractDays(today(), {historical_data_days_back:UInt32}));
