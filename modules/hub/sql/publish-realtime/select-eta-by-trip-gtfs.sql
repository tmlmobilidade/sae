-- ============================================================================
-- GTFS-RT TripUpdate JSON feed — grouped by trip (key/value)
-- ============================================================================
-- Same TripUpdate payload as select-eta-gtfs.sql, keyed by composite trip_id
-- for per-trip cache lookups (hub:v1:realtime:eta:by-trip:*:gtfs).
-- ============================================================================

WITH trip_summary AS (
    SELECT
        hashed_trip_id,
        argMin(arrival_time, stop_sequence) AS first_arrival_time
    FROM eta.curr_waypoints_snapped
    GROUP BY hashed_trip_id
),

stops AS (
    SELECT
        if(
            empty(r._id),
            e.trip_id,
            concat('[', r.plan_id, ']', '[', r.agency_id, ']', e.trip_id)
        )                                                                        AS trip_id,
        e.vehicle_id                                                             AS vehicle_id,
        e.stop_id                                                                AS stop_id,
        e.stop_sequence                                                          AS stop_sequence,
        intDiv(e.position_created_at, 1000)                                      AS position_unix,

        -- Estimated arrival (Unix seconds): prefer eta_at, fallback position + eta_seconds
        multiIf(
            e.eta_at IS NOT NULL,
                toNullable(toInt64(intDiv(assumeNotNull(e.eta_at), 1000))),
            e.eta_seconds IS NOT NULL,
                toNullable(intDiv(e.position_created_at, 1000) + toInt64(assumeNotNull(e.eta_seconds))),
            NULL
        )                                                                        AS estimated_arrival_unix,

        -- Scheduled arrival (Unix seconds): ride start + (stop_arrival - first_stop_arrival)
        if(
            length(w.arrival_time) = 0 OR length(ts.first_arrival_time) = 0,
            NULL,
            toNullable(
                toInt64(intDiv(r.start_time_scheduled, 1000))
                + (
                    toInt64(splitByChar(':', w.arrival_time)[1]) * 3600
                    + toInt64(splitByChar(':', w.arrival_time)[2]) * 60
                    + toInt64(splitByChar(':', w.arrival_time)[3])
                    - toInt64(splitByChar(':', ts.first_arrival_time)[1]) * 3600
                    - toInt64(splitByChar(':', ts.first_arrival_time)[2]) * 60
                    - toInt64(splitByChar(':', ts.first_arrival_time)[3])
                )
            )
        )                                                                        AS scheduled_arrival_unix
    FROM eta.pred_trip_stop_etas AS e FINAL
    LEFT JOIN eta.curr_waypoints_snapped AS w
        ON w.hashed_trip_id = e.hashed_trip_id AND w.stop_sequence = e.stop_sequence
    LEFT JOIN eta.curr_rides AS r
        ON r.trip_id = e.trip_id
    LEFT JOIN trip_summary AS ts
        ON ts.hashed_trip_id = e.hashed_trip_id
    WHERE estimated_arrival_unix IS NOT NULL
    ORDER BY trip_id, stop_sequence, stop_id
    LIMIT 1 BY trip_id, stop_id
),

trip_agg AS (
    SELECT
        trip_id,
        any(vehicle_id)             AS vehicle_id,
        toInt64(max(position_unix)) AS timestamp,
        arraySort(
            x -> x.1,
            groupArray(
                tuple(
                    stop_sequence,
                    stop_id,
                    estimated_arrival_unix,
                    scheduled_arrival_unix
                )
            )
        )                           AS stop_rows
    FROM stops
    GROUP BY trip_id
)

SELECT
    trip_id AS key,
    toJSONString(
        CAST(
            (
                CAST(tuple(trip_id) AS Tuple(trip_id String)),
                CAST(tuple(vehicle_id) AS Tuple(id String)),
                arrayMap(
                    s -> CAST(
                        (
                            s.1,
                            s.2,
                            CAST(
                                (
                                    s.3,
                                    if(s.3 IS NULL OR s.4 IS NULL, NULL, s.3 - s.4)
                                )
                                AS Tuple(time Nullable(Int64), delay Nullable(Int64))
                            ),
                            'SCHEDULED'
                        )
                        AS Tuple(
                            stop_sequence UInt16,
                            stop_id String,
                            arrival Tuple(time Nullable(Int64), delay Nullable(Int64)),
                            schedule_relationship String
                        )
                    ),
                    stop_rows
                ),
                timestamp
            )
            AS Tuple(
                trip Tuple(trip_id String),
                vehicle Tuple(id String),
                stop_time_update Array(
                    Tuple(
                        stop_sequence UInt16,
                        stop_id String,
                        arrival Tuple(time Nullable(Int64), delay Nullable(Int64)),
                        schedule_relationship String
                    )
                ),
                timestamp Int64
            )
        )
    ) AS value
FROM trip_agg
ORDER BY key;
