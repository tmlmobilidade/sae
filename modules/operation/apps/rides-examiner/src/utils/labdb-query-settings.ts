/* * */

//
// Per-query ClickHouse settings for the examiner reads.
// These are tiny point lookups (a handful of granules each), executed millions of times per day.
// max_threads: avoid spinning up dozens of threads per query.
// statistics: skip loading per-part statistics at plan time (the primary key prunes to the same granules).
// profiling/logging: do not write processors_profile_log or profiler samples for every execution.

export const LABDB_QUERY_SETTINGS = 'SETTINGS max_threads = 4, use_statistics_for_part_pruning = 0, allow_statistics_optimize = 0, log_processors_profiles = 0, query_profiler_real_time_period_ns = 0, query_profiler_cpu_time_period_ns = 0';
