SELECT
    stop_id AS key,
    toJSONString(
        arraySort(
            x -> x.stop_sequence,
            groupArray(
                CAST(
                    (
                        concat('[', plan_id, ']', '[', agency_id, ']', trip_id),
                        vehicle_id,
                        toUInt16(stop_sequence),
                        stop_id,
                        stop_name,
                        toInt32(intDiv(eta_at - toUnixTimestamp64Milli(now64(3)), 1000)),
                        toInt64(eta_at)
                    )
                    AS Tuple(
                        trip_id String,
                        vehicle_id String,
                        stop_sequence UInt16,
                        stop_id String,
                        stop_name String,
                        eta_seconds Int32,
                        eta_at Int64
                    )
                )
            )
        )
    ) AS value
FROM eta.pred_trip_stop_etas FINAL
GROUP BY stop_id
ORDER BY key;
