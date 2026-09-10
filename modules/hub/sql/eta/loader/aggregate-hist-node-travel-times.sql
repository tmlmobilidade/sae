-- =============================================================================
-- Aggregates travel time statistics per shape, node, and calendar/time segment.
-- Source: eta.hist_node_travel_times
-- Target: eta.hist_node_travel_times_aggregation
--
-- Processes ONE operational day per run ($chunk_date). The loader iterates the
-- historical window day by day, so aggregation state stays bounded to a single
-- day's groups instead of the whole window (which previously exceeded the query
-- memory limit during the final GROUP BY merge).
--
-- $scan_start/$scan_end (ms epoch) bound the created_at scan generously
-- around the operational day (timezone-agnostic padding); the exact row
-- selection is done by the operational_date = $chunk_date filter, so chunk
-- boundaries can never split an aggregation group.
--
-- Dimensions produced:
--   - operational_date : service date (pre-4h events shifted to previous day)
--   - period_of_day             : time-of-day bucket based on event hour
--   - weekday                   : day name
--   - day_type                  : Weekday | Weekend
-- =============================================================================

INSERT INTO eta.hist_node_travel_times_aggregation (
    hashed_shape_id,
    node_index,
    operational_date,
    period_of_day,
    weekday,
    day_type,
    avg_travel_time_seconds,
    min_travel_time_seconds,
    max_travel_time_seconds,
    median_travel_time_seconds,
    inserted_at
)
WITH

-- -----------------------------------------------------------------------------
-- Step 1: Parse raw timestamps and compute the operational service day.
--
-- Transit services before 04:00 belong to the previous service day
-- (e.g. a 01:30 trip on Tuesday is logically Monday's schedule).
-- created_at is stored as milliseconds-since-epoch.
-- -----------------------------------------------------------------------------
parsed_timestamps AS (
    SELECT
        hashed_shape_id,
        node_index,
        travel_time_seconds,
        fromUnixTimestamp64Milli(toInt64(created_at)) AS event_ts,
        if(
            toHour(fromUnixTimestamp64Milli(toInt64(created_at))) < 4,
            fromUnixTimestamp64Milli(toInt64(created_at)) - INTERVAL 1 DAY,
            fromUnixTimestamp64Milli(toInt64(created_at))
        ) AS operational_ts
    FROM eta.hist_node_travel_times
    WHERE
        travel_time_seconds > 0  -- discard zero/null samples (GPS noise, missing segments)
        AND created_at >= $scan_start
        AND created_at < $scan_end
),

-- -----------------------------------------------------------------------------
-- Step 2: Derive date and time fields used for grouping and classification,
--         and keep only rows belonging to this chunk's operational day.
-- -----------------------------------------------------------------------------
derived_fields AS (
    SELECT
        hashed_shape_id,
        node_index,
        travel_time_seconds,
        toUInt32(formatDateTime(operational_ts, '%Y%m%d')) AS operational_date,
        toHour(event_ts)             AS event_hour,        -- raw wall-clock hour for period_of_day
        toDayOfWeek(operational_ts)  AS operational_weekday -- 1=Mon … 7=Sun
    FROM parsed_timestamps
    WHERE toUInt32(formatDateTime(operational_ts, '%Y%m%d')) = $chunk_date
),

-- -----------------------------------------------------------------------------
-- Step 3: Classify each sample into time-of-day segments.
--
-- period_of_day: uses raw event_hour (not the shifted operational date) so that
--                a 23:50 trip correctly falls into 'Off Peak', not the next day's AM.
-- weekday/day_type: derived from operational_ts so they respect the pre-4h shift.
-- -----------------------------------------------------------------------------
classified AS (
    SELECT
        hashed_shape_id,
        node_index,
        operational_date,
        travel_time_seconds,

        multiIf(
            event_hour BETWEEN 7  AND 9,  'Peak AM',
            event_hour BETWEEN 10 AND 16, 'Mid',
            event_hour BETWEEN 17 AND 19, 'Peak PM',
            'Off Peak'
        ) AS period_of_day,

        multiIf(
            operational_weekday = 1, 'Monday',
            operational_weekday = 2, 'Tuesday',
            operational_weekday = 3, 'Wednesday',
            operational_weekday = 4, 'Thursday',
            operational_weekday = 5, 'Friday',
            operational_weekday = 6, 'Saturday',
            'Sunday'
        ) AS weekday,

        if(operational_weekday BETWEEN 1 AND 5, 'Weekday', 'Weekend') AS day_type

    FROM derived_fields
)

-- -----------------------------------------------------------------------------
-- Final: Aggregate per shape/node/date/segment combination.
-- quantile (reservoir sampling) instead of quantileExact: bounded memory per
-- group; for small-integer travel times the difference is negligible.
-- -----------------------------------------------------------------------------
SELECT
    hashed_shape_id,
    node_index,
    operational_date,
    period_of_day,
    weekday,
    day_type,
    round(avg(travel_time_seconds))           AS avg_travel_time_seconds,
    round(min(travel_time_seconds))           AS min_travel_time_seconds,
    round(max(travel_time_seconds))           AS max_travel_time_seconds,
    round(quantile(0.5)(travel_time_seconds)) AS median_travel_time_seconds,
    now()                                     AS inserted_at
FROM classified
GROUP BY
    hashed_shape_id,
    node_index,
    operational_date,
    period_of_day,
    weekday,
    day_type
SETTINGS max_bytes_before_external_group_by = 4000000000;
