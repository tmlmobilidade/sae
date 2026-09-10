-- Live ETA per stop + refreshable MV.
-- Depends: eta.live_vehicle_positions, eta.curr_rides, eta.curr_waypoints_snapped,
--          eta.node_predictions (02-node-predictions-mv.sql),
--          infrastructure.stops (MongoDB engine; agency stop_id → GO _id via flags).

CREATE TABLE IF NOT EXISTS eta.pred_trip_stop_etas
(
    trip_id String,
    agency_id String,
    plan_id String,
    vehicle_id String,
    hashed_trip_id String,
    hashed_shape_id String,
    current_node_index UInt32,
    current_node_latitude Float64,
    current_node_longitude Float64,
    position_created_at Int64,
    stop_sequence UInt16,
    stop_id String,
    stop_name String,
    stop_node_index UInt32,
    stop_node_latitude Float64,
    stop_node_longitude Float64,
    eta_seconds Nullable(UInt16),
    eta_at Nullable(Int64),
    refreshed_at Int64
)
ENGINE = ReplacingMergeTree(refreshed_at)
ORDER BY (trip_id, vehicle_id, stop_sequence);

CREATE MATERIALIZED VIEW IF NOT EXISTS eta.mv_pred_trip_stop_etas
REFRESH EVERY 30 SECOND
TO eta.pred_trip_stop_etas
AS
WITH
    -- Newest GPS fix per (trip, vehicle): anchors the clock and the shape.
    latest_fix AS (
        SELECT
            trip_id,
            vehicle_id,
            argMax(hashed_shape_id, created_at) AS hashed_shape_id,
            max(created_at)                     AS position_created_at
        FROM eta.curr_vehicle_events
        WHERE created_at >= toUnixTimestamp64Milli(now64(3)) - 30 * 60 * 1000
        GROUP BY trip_id, vehicle_id
    ),
    -- Current node = furthest-forward node observed in the last 2 minutes before
    -- the newest fix. Using the max progress (instead of a single argMax sample)
    -- stops a noisy/backward-snapped latest GPS point from dragging the position
    -- behind the vehicle's true realtime location.
    latest_pos AS (
        SELECT
            lf.trip_id             AS trip_id,
            lf.vehicle_id          AS vehicle_id,
            lf.hashed_shape_id     AS hashed_shape_id,
            max(e.node_index)      AS current_node_index,
            lf.position_created_at AS position_created_at
        FROM latest_fix AS lf
        INNER JOIN eta.curr_vehicle_events AS e
            ON e.trip_id = lf.trip_id
           AND e.vehicle_id = lf.vehicle_id
        WHERE e.created_at BETWEEN lf.position_created_at - 2 * 60 * 1000
                               AND lf.position_created_at
        GROUP BY
            lf.trip_id,
            lf.vehicle_id,
            lf.hashed_shape_id,
            lf.position_created_at
    ),
    pos_with_trip AS (
        SELECT
            lp.trip_id                  AS trip_id,
            lp.vehicle_id               AS vehicle_id,
            lp.hashed_shape_id          AS hashed_shape_id,
            d.agency_id                 AS agency_id,
            d.plan_id                   AS plan_id,
            d.hashed_trip_id            AS hashed_trip_id,
            lp.current_node_index       AS current_node_index,
            cn.latitude                 AS current_node_latitude,
            cn.longitude                AS current_node_longitude,
            lp.position_created_at      AS position_created_at,
            fromUnixTimestamp64Milli(lp.position_created_at) AS pos_dt
        FROM latest_pos AS lp
        INNER JOIN eta.curr_rides AS d ON lp.trip_id = d.trip_id
        LEFT JOIN eta.hist_shape_nodes AS cn
            ON cn.hashed_shape_id = lp.hashed_shape_id
           AND cn.node_index = lp.current_node_index
    ),
    pos_with_op_dt AS (
        SELECT
            *,
            toHour(pos_dt)                                                 AS event_hour,
            if(toHour(pos_dt) < 4, pos_dt - INTERVAL 1 DAY, pos_dt)        AS operational_dt
        FROM pos_with_trip
    ),
    pos_classified AS (
        SELECT
            *,
            toUInt32(formatDateTime(operational_dt, '%Y%m%d')) AS operational_date,
            toDayOfWeek(operational_dt)                        AS dow,
            multiIf(
                event_hour BETWEEN 7  AND 9,  'Peak AM',
                event_hour BETWEEN 10 AND 16, 'Mid',
                event_hour BETWEEN 17 AND 19, 'Peak PM',
                'Off Peak'
            ) AS period_of_day
        FROM pos_with_op_dt
    ),
    pos_full AS (
        SELECT
            *,
            multiIf(
                dow = 1, 'Monday',
                dow = 2, 'Tuesday',
                dow = 3, 'Wednesday',
                dow = 4, 'Thursday',
                dow = 5, 'Friday',
                dow = 6, 'Saturday',
                'Sunday'
            ) AS weekday,
            if(dow BETWEEN 1 AND 5, 'Weekday', 'Weekend') AS day_type
        FROM pos_classified
    ),
    recent_events AS (
        SELECT
            pf.trip_id             AS trip_id,
            pf.vehicle_id          AS vehicle_id,
            pf.hashed_shape_id     AS hashed_shape_id,
            pf.period_of_day       AS period_of_day,
            pf.weekday             AS weekday,
            pf.day_type            AS day_type,
            pf.position_created_at AS position_created_at,
            e.node_index           AS node_index,
            e.created_at           AS created_at
        FROM pos_full AS pf
        INNER JOIN eta.curr_vehicle_events AS e
            ON e.trip_id = pf.trip_id
           AND e.vehicle_id = pf.vehicle_id
        WHERE e.created_at BETWEEN pf.position_created_at - 10 * 60 * 1000
                               AND pf.position_created_at
    ),
    event_steps AS (
        SELECT
            trip_id,
            vehicle_id,
            hashed_shape_id,
            period_of_day,
            weekday,
            day_type,
            position_created_at,
            node_index,
            created_at,
            lagInFrame(toNullable(node_index)) OVER (
                PARTITION BY trip_id, vehicle_id
                ORDER BY created_at
            ) AS prev_node_index,
            lagInFrame(toNullable(created_at)) OVER (
                PARTITION BY trip_id, vehicle_id
                ORDER BY created_at
            ) AS prev_created_at
        FROM recent_events
    ),
    live_observed AS (
        SELECT
            trip_id,
            vehicle_id,
            hashed_shape_id,
            period_of_day,
            weekday,
            day_type,
            position_created_at,
            countIf(
                prev_node_index IS NOT NULL
                AND prev_created_at IS NOT NULL
                AND node_index > prev_node_index
                AND created_at > prev_created_at
            ) AS move_samples,
            sumIf(
                (created_at - prev_created_at) / 1000.0,
                prev_node_index IS NOT NULL
                AND prev_created_at IS NOT NULL
                AND node_index > prev_node_index
                AND created_at > prev_created_at
            ) AS observed_seconds,
            minIf(
                prev_node_index,
                prev_node_index IS NOT NULL
                AND prev_created_at IS NOT NULL
                AND node_index > prev_node_index
                AND created_at > prev_created_at
            ) AS start_node_index,
            maxIf(
                node_index,
                prev_node_index IS NOT NULL
                AND prev_created_at IS NOT NULL
                AND node_index > prev_node_index
                AND created_at > prev_created_at
            ) AS end_node_index
        FROM event_steps
        GROUP BY
            trip_id,
            vehicle_id,
            hashed_shape_id,
            period_of_day,
            weekday,
            day_type,
            position_created_at
    ),
    live_baseline AS (
        SELECT
            lo.trip_id             AS trip_id,
            lo.vehicle_id          AS vehicle_id,
            lo.position_created_at AS position_created_at,
            lo.move_samples        AS move_samples,
            lo.observed_seconds    AS observed_seconds,
            sum(p.predicted_travel_time_seconds) AS baseline_seconds
        FROM live_observed AS lo
        LEFT JOIN eta.pred_node_etas AS p
            ON p.hashed_shape_id = lo.hashed_shape_id
           AND p.period_of_day   = lo.period_of_day
           AND p.weekday         = lo.weekday
           AND p.day_type        = lo.day_type
           AND p.node_index >  lo.start_node_index
           AND p.node_index <= lo.end_node_index
        GROUP BY
            lo.trip_id,
            lo.vehicle_id,
            lo.position_created_at,
            lo.move_samples,
            lo.observed_seconds
    ),
    live_factor AS (
        SELECT
            trip_id,
            vehicle_id,
            if(
                move_samples > 0
                AND observed_seconds > 0
                AND baseline_seconds > 0
                AND isFinite(observed_seconds / baseline_seconds),
                greatest(
                    toFloat64(0.7),
                    least(
                        toFloat64(1.4),
                        1
                        + (
                            least(toFloat64(0.45), toFloat64(move_samples) / 8.0)
                            * exp(
                                -greatest(
                                    toFloat64(0),
                                    (toUnixTimestamp64Milli(now64(3)) - position_created_at) / 1000.0
                                ) / 180.0
                            )
                        ) * ((observed_seconds / baseline_seconds) - 1)
                    )
                ),
                toFloat64(1)
            ) AS live_adjustment
        FROM live_baseline
    ),
    upcoming AS (
        SELECT
            pf.trip_id                  AS trip_id,
            pf.vehicle_id               AS vehicle_id,
            pf.agency_id                AS agency_id,
            pf.plan_id                  AS plan_id,
            pf.hashed_shape_id          AS hashed_shape_id,
            pf.hashed_trip_id           AS hashed_trip_id,
            pf.current_node_index       AS current_node_index,
            pf.current_node_latitude    AS current_node_latitude,
            pf.current_node_longitude   AS current_node_longitude,
            pf.position_created_at      AS position_created_at,
            pf.period_of_day            AS period_of_day,
            pf.weekday                  AS weekday,
            pf.day_type                 AS day_type,
            w.stop_sequence             AS stop_sequence,
            w.stop_id                   AS stop_id,
            w.stop_name                 AS stop_name,
            w.node_index                AS stop_node_index,
            sn.latitude                 AS stop_node_latitude,
            sn.longitude                AS stop_node_longitude
        FROM pos_full AS pf
        INNER JOIN eta.curr_waypoints_snapped AS w
            ON pf.hashed_trip_id = w.hashed_trip_id
        LEFT JOIN eta.hist_shape_nodes AS sn
            ON sn.hashed_shape_id = pf.hashed_shape_id
           AND sn.node_index = w.node_index
        WHERE w.node_index >= pf.current_node_index
    ),
    -- One distinct (trip, vehicle) per live position. This is the driving set
    -- for the per-node scan below, so each shape's nodes are read once per
    -- vehicle instead of once per upcoming stop.
    live_trips AS (
        SELECT DISTINCT
            trip_id,
            vehicle_id,
            hashed_shape_id,
            current_node_index,
            period_of_day,
            weekday,
            day_type
        FROM pos_full
    ),
    -- Per (trip, vehicle) node travel times for every node still AHEAD of the
    -- vehicle, with the live adjustment applied. The node_index > current_node
    -- predicate is on the pred_node_etas ORDER BY prefix, so this scans only the
    -- remaining slice of each shape rather than the whole shape per stop.
    trip_nodes AS (
        SELECT
            lt.trip_id        AS trip_id,
            lt.vehicle_id     AS vehicle_id,
            p.node_index      AS node_index,
            p.predicted_travel_time_seconds
                * coalesce(lf.live_adjustment, toFloat64(1)) AS node_seconds
        FROM live_trips AS lt
        INNER JOIN eta.pred_node_etas AS p
            ON p.hashed_shape_id = lt.hashed_shape_id
           AND p.period_of_day   = lt.period_of_day
           AND p.weekday         = lt.weekday
           AND p.day_type        = lt.day_type
           AND p.node_index      > lt.current_node_index
        LEFT JOIN live_factor AS lf
            ON lf.trip_id    = lt.trip_id
           AND lf.vehicle_id = lt.vehicle_id
    ),
    -- Running cumulative travel time from current_node up to (and including)
    -- each node. NULL node predictions contribute 0, matching the original
    -- sumIf semantics. Computing this once per node turns the old
    -- O(stops x nodes) join into an O(nodes) window scan.
    trip_node_cum AS (
        SELECT
            trip_id,
            vehicle_id,
            node_index,
            sum(coalesce(node_seconds, toFloat64(0))) OVER (
                PARTITION BY trip_id, vehicle_id
                ORDER BY node_index
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS cum_seconds,
            countIf(node_seconds IS NOT NULL) OVER (
                PARTITION BY trip_id, vehicle_id
                ORDER BY node_index
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS cum_known_nodes
        FROM trip_nodes
    ),
    -- Each stop's ETA is the cumulative sum at the last predicted node at or
    -- before the stop. Stop node_indexes come from hist_shape_nodes and need not
    -- exist in pred_node_etas, so an ASOF (<=) match picks the nearest preceding
    -- predicted node, exactly like the original sumIf over node_index <= stop.
    -- Stops sitting at/behind current_node_index find no preceding row and fall
    -- through to 0.
    eta_calc AS (
        SELECT
            u.trip_id             AS trip_id,
            u.vehicle_id          AS vehicle_id,
            u.agency_id           AS agency_id,
            u.plan_id             AS plan_id,
            u.hashed_trip_id      AS hashed_trip_id,
            u.hashed_shape_id         AS hashed_shape_id,
            u.current_node_index      AS current_node_index,
            u.current_node_latitude   AS current_node_latitude,
            u.current_node_longitude  AS current_node_longitude,
            u.position_created_at     AS position_created_at,
            u.stop_sequence           AS stop_sequence,
            u.stop_id                 AS stop_id,
            u.stop_name               AS stop_name,
            u.stop_node_index         AS stop_node_index,
            u.stop_node_latitude      AS stop_node_latitude,
            u.stop_node_longitude     AS stop_node_longitude,
            if(c.cum_known_nodes > 0, c.cum_seconds, toFloat64(0)) AS eta_seconds_raw
        FROM upcoming AS u
        ASOF LEFT JOIN trip_node_cum AS c
            ON c.trip_id     = u.trip_id
           AND c.vehicle_id  = u.vehicle_id
           AND c.node_index <= u.stop_node_index
    ),
    eta_clean AS (
        SELECT
            trip_id,
            vehicle_id,
            agency_id,
            plan_id,
            hashed_trip_id,
            hashed_shape_id,
            current_node_index,
            current_node_latitude,
            current_node_longitude,
            position_created_at,
            stop_sequence,
            stop_id,
            stop_name,
            stop_node_index,
            stop_node_latitude,
            stop_node_longitude,
            if(eta_seconds_raw IS NOT NULL AND isFinite(assumeNotNull(eta_seconds_raw)),
               toUInt16(ceil(assumeNotNull(eta_seconds_raw))), NULL) AS eta_seconds
        FROM eta_calc
    ),
    -- Agency/GTFS stop_id → GO stop _id. curr_waypoints_snapped carries agency
    -- identifiers; infrastructure.stops.flags[].stop_id is the join key.
    -- ponytail: MongoDB engine cannot push JSON/ARRAY JOIN to Mongo; full stops
    -- scan on ClickHouse side (~30k rows, acceptable at 30s refresh).
    go_stop_flags AS (
        SELECT
            agency_stop_id,
            any(go_stop_id) AS go_stop_id
        FROM (
            SELECT
                toString(go_stops._id)             AS go_stop_id,
                JSONExtractString(flag, 'stop_id') AS agency_stop_id
            FROM (
                SELECT
                    _id,
                    flags
                FROM infrastructure.stops
                SETTINGS mongodb_throw_on_unsupported_query = 0
            ) AS go_stops
            ARRAY JOIN JSONExtractArrayRaw(assumeNotNull(go_stops.flags)) AS flag
        )
        WHERE agency_stop_id != ''
        GROUP BY agency_stop_id
    ),
    eta_resolved AS (
        SELECT
            ec.trip_id,
            ec.agency_id,
            ec.plan_id,
            ec.vehicle_id,
            ec.hashed_trip_id,
            ec.hashed_shape_id,
            ec.current_node_index,
            ec.current_node_latitude,
            ec.current_node_longitude,
            ec.position_created_at,
            ec.stop_sequence,
            coalesce(gs.go_stop_id, ec.stop_id) AS stop_id,
            ec.stop_name,
            ec.stop_node_index,
            ec.stop_node_latitude,
            ec.stop_node_longitude,
            ec.eta_seconds
        FROM eta_clean AS ec
        LEFT JOIN go_stop_flags AS gs
            ON gs.agency_stop_id = ec.stop_id
    )
SELECT
    trip_id,
    agency_id,
    plan_id,
    vehicle_id,
    hashed_trip_id,
    hashed_shape_id,
    current_node_index,
    current_node_latitude,
    current_node_longitude,
    position_created_at,
    stop_sequence,
    stop_id,
    stop_name,
    stop_node_index,
    stop_node_latitude,
    stop_node_longitude,
    eta_seconds,
    if(
        eta_seconds IS NULL,
        NULL,
        position_created_at + toInt64(assumeNotNull(eta_seconds)) * 1000
    ) AS eta_at,
    toUnixTimestamp64Milli(now64(3)) AS refreshed_at
FROM eta_resolved;
