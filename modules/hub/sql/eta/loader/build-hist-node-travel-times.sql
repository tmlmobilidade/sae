INSERT INTO eta.hist_node_travel_times
WITH
    25     AS segment_length_m,
    30     AS max_dist_m,
    90     AS bearing_threshold_deg,
    -- Spatial bbox for pre-filtering shape_nodes during the snap join.
    -- 0.001 deg ~= 111 m at equator, ~55 m at 60 lat; safely covers max_dist_m
    -- and dramatically prunes the join fan-out before aggregation.
    0.001  AS bbox_deg,

    -- 1. SNAP: for every raw GPS ping, find the nearest node on the matching shape.
    --    Optimizations vs naive version:
    --      a) Geohash-6 cell equality is added to the join key. Each event is expanded
    --         (arrayJoin geohashesInBox) into the ~3-4 cells its bbox touches; the join
    --         then probes (hashed_shape_id, geohash) buckets. Must match
    --         hist_shape_nodes encoding (geohashPrefixLength = 6).
    --      b) Bbox stays as a residual filter — clips cell-boundary noise cheaply.
    --      c) Each (event, node) pair is unique because a node sits in exactly one
    --         geohash cell, so no DISTINCT/dedup is needed before argMin.
    --      d) Single tuple argMin instead of three separate argMins => ~3x less aggregator state
    --         and one greatCircleDistance call per row instead of four.
    --      e) GROUP BY event_id only (unique per event), carry over the rest with any() —
    --         avoids hashing on Float64 lat/lon and other wide keys.
    --    Recommended DDL companion (one-time): a data-skipping index on geohash to
    --    prune granules on the shape_nodes side, e.g.
    --      ALTER TABLE eta.hist_shape_nodes
    --        ADD INDEX idx_geohash geohash TYPE bloom_filter GRANULARITY 1;
    matched_events AS (
        SELECT
            e._id                            AS event_id,
            any(e.ride_id)                   AS ride_id,
            any(e.hashed_shape_id)           AS hashed_shape_id,
            any(e.created_at)                AS created_at,
            any(e.latitude)                  AS e_lat,
            any(e.longitude)                 AS e_lon,
            argMin(
                (n.node_index, n.latitude, n.longitude),
                greatCircleDistance(e.longitude, e.latitude, n.longitude, n.latitude)
            )                                AS nearest,
            min(greatCircleDistance(e.longitude, e.latitude, n.longitude, n.latitude)) AS dist
        FROM (
            -- Expand each event into (event, candidate_geohash6_cell) tuples so the
            -- downstream join can use (hashed_shape_id, geohash) as a compound equality
            -- hash-join key. precision 6 matches hist_shape_nodes; the bbox refine
            -- below trims residual noise.
            SELECT
                _id,
                ride_id,
                hashed_shape_id,
                created_at,
                latitude,
                longitude,
                arrayJoin(
                    geohashesInBox(
                        toFloat32(longitude - bbox_deg),
                        toFloat32(latitude  - bbox_deg),
                        toFloat32(longitude + bbox_deg),
                        toFloat32(latitude  + bbox_deg),
                        6
                    )
                ) AS cell
            FROM eta.hist_vehicle_events
            WHERE
                created_at >= $chunk_start
                AND created_at < $chunk_end
        ) AS e
        INNER JOIN eta.hist_shape_nodes AS n
            ON  e.hashed_shape_id = n.hashed_shape_id
            AND e.cell            = n.geohash
            -- bbox residual: applied during hash-join probe, before GROUP BY.
            AND n.latitude  BETWEEN e.latitude  - bbox_deg AND e.latitude  + bbox_deg
            AND n.longitude BETWEEN e.longitude - bbox_deg AND e.longitude + bbox_deg
        GROUP BY e._id
        HAVING dist <= max_dist_m
    ),

    -- 2. FORWARD-ONLY FILTER: keep events whose snapped index does not go backwards
    --    versus previous raw event in timestamp order.
    --    IMPORTANT: use lag() (local monotonicity), not running max().
    --    A single outlier snap can jump far ahead; running max then "poisons" the ride
    --    and discards almost all following valid events.
    forward_matched_events AS (
        SELECT
            event_id,
            ride_id,
            hashed_shape_id,
            created_at,
            e_lat,
            e_lon,
            nearest.1 AS node_idx,
            nearest.2 AS node_lat,
            nearest.3 AS node_lon
        FROM (
            SELECT
                *,
                lag(nearest.1) OVER (
                    PARTITION BY ride_id
                    ORDER BY created_at, event_id
                ) AS prev_idx
            FROM matched_events
        )
        WHERE prev_idx IS NULL OR nearest.1 >= prev_idx
    ),

    -- 3. PAIR + VALIDATE in one pass (segments + filtered_segments fused).
    --    Segments where prev_idx IS NULL or filters fail are removed via WHERE
    --    on the outer SELECT below; this keeps a single window pass.
    filtered_segments AS (
        SELECT *
        FROM (
            SELECT
                event_id,
                hashed_shape_id,
                ride_id,
                node_idx                                AS curr_idx,
                node_lat                                AS curr_node_lat,
                node_lon                                AS curr_node_lon,
                lag(node_idx)  OVER w                   AS prev_idx,
                lag(node_lat)  OVER w                   AS prev_node_lat,
                lag(node_lon)  OVER w                   AS prev_node_lon,
                created_at                              AS curr_ts,
                lag(created_at) OVER w                  AS prev_ts,
                e_lat                                   AS curr_lat,
                e_lon                                   AS curr_lon,
                lag(e_lat) OVER w                       AS prev_lat,
                lag(e_lon) OVER w                       AS prev_lon
            FROM forward_matched_events
            WINDOW w AS (PARTITION BY ride_id ORDER BY created_at)
        )
        WHERE
            prev_idx IS NOT NULL
            AND curr_idx > prev_idx
            AND (curr_ts - prev_ts) > 0
            AND ((curr_idx - prev_idx) * segment_length_m)
                / ((curr_ts - prev_ts) / 1000.0) * 3.6
                BETWEEN 1 AND 120
            -- Bearing check using pre-fetched node coords.
            AND abs(
                    atan2(curr_lat       - prev_lat,       curr_lon       - prev_lon) -
                    atan2(curr_node_lat  - prev_node_lat,  curr_node_lon  - prev_node_lon)
                ) < (bearing_threshold_deg * pi() / 180)
    ),

    -- 4. EXPAND: turn each valid segment into one row per traversed node, evenly
    --    distributing whole seconds. We DO NOT compute travel_time_seconds here:
    --    it is set authoritatively in step 5 (lead() over the per-node timeline),
    --    so emitting it twice is wasted work.
    expanded_nodes AS (
        SELECT
            event_id,
            hashed_shape_id,
            ride_id,
            node_tuple.1 AS node_index,
            toUInt8(toHour(toDateTime(intDiv(toInt64(node_tuple.2), 1000)))) AS hour,
            node_tuple.2 AS created_at,
            round(speed_kmh) AS speed_kmh
        FROM (
            SELECT
                event_id,
                hashed_shape_id,
                ride_id,
                speed_kmh,
                arrayJoin(
                    arrayMap(
                        i -> (
                            toUInt64(prev_idx + i),
                            toInt64(
                                prev_ts
                                + 1000 * ((i - 1) * base_sec + least(i - 1, rem_sec))
                            )
                        ),
                        range(1, toUInt64(nodes_count + 1))
                    )
                ) AS node_tuple
            FROM (
                SELECT
                    event_id,
                    hashed_shape_id,
                    ride_id,
                    prev_idx,
                    prev_ts,
                    (((curr_idx - prev_idx) * segment_length_m)
                        / ((curr_ts - prev_ts) / 1000.0)) * 3.6 AS speed_kmh,
                    toInt64(curr_idx - prev_idx)               AS nodes_count,
                    intDiv(
                        greatest(
                            toInt64(round((curr_ts - prev_ts) / 1000.0)),
                            toInt64(curr_idx - prev_idx)
                        ),
                        toInt64(curr_idx - prev_idx)
                    )                                          AS base_sec,
                    modulo(
                        greatest(
                            toInt64(round((curr_ts - prev_ts) / 1000.0)),
                            toInt64(curr_idx - prev_idx)
                        ),
                        toInt64(curr_idx - prev_idx)
                    )                                          AS rem_sec
                FROM filtered_segments
            )
        )
    ),

    -- 5. RE-TIME: per-node travel time = gap to the next emitted node timestamp
    --    within the same filtered segment (event_id). Last node in a segment gets 0.
    --    Partitioning by event_id prevents lead() from bridging dropped segments
    --    (slow GPS gaps, failed speed/bearing checks) and attributing multi-minute
    --    dwell time to individual 25 m shape nodes.
    retimed_nodes AS (
        SELECT
            event_id,
            hashed_shape_id,
            ride_id,
            node_index,
            hour,
            created_at,
            toUInt32(
                if(
                    next_created_at IS NULL,
                    0,
                    greatest(intDiv(next_created_at - created_at, 1000), 0)
                )
            ) AS travel_time_seconds,
            speed_kmh
        FROM (
            SELECT
                *,
                lead(created_at) OVER (
                    PARTITION BY ride_id, hashed_shape_id, event_id
                    ORDER BY node_index
                ) AS next_created_at
            FROM expanded_nodes
        )
    )

-- 6. ENRICH: attach per-node lat/lon from shape_nodes.
--    Both retimed_nodes (effectively keyed by hashed_shape_id, node_index) and
--    shape_nodes (ORDER BY (hashed_shape_id, node_index)) are amenable to a sort-merge,
--    avoiding a full hash table over shape_nodes in memory.
SELECT
    rn.event_id,
    rn.ride_id,
    rn.hashed_shape_id,
    rn.node_index,
    rn.hour,
    rn.created_at,
    rn.travel_time_seconds,
    rn.speed_kmh,
    sn.latitude,
    sn.longitude
FROM retimed_nodes AS rn
INNER JOIN (
    -- Restrict shape_nodes to shapes actually present in this batch.
    -- Helps both hash and sort-merge by shrinking the right side.
    SELECT hashed_shape_id, node_index, latitude, longitude
    FROM eta.hist_shape_nodes
    WHERE hashed_shape_id IN (SELECT DISTINCT hashed_shape_id FROM retimed_nodes)
) AS sn
    ON  rn.hashed_shape_id = sn.hashed_shape_id
    AND rn.node_index      = sn.node_index
SETTINGS
    join_algorithm = 'full_sorting_merge',
    max_bytes_in_join = 0,
    -- Safety net: spill the per-event snap aggregation (GROUP BY e._id) to disk
    -- instead of dying on unusually heavy days.
    max_bytes_before_external_group_by = 4000000000;
