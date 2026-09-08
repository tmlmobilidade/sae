/* * */

import { REQUIRED_ANALYSES } from '../types/ride-with-analyses.js';

/* * */

function analysisCteName(analysis: string) {
	return `analysis_${analysis}`;
}

function analysisTableName(analysis: string) {
	return `ride_analysis_${analysis}`;
}

function buildAnalysisCte(analysis: string) {
	const cteName = analysisCteName(analysis);
	const tableName = analysisTableName(analysis);

	return `
	${cteName} AS
	(
		SELECT
			ride_id,
			argMax(grade_status, updated_at) AS grade_status,
			argMax(reason, updated_at) AS reason
		FROM operation.${tableName}
		WHERE operational_date IN
		(
			SELECT DISTINCT operational_date
			FROM rides_latest
		)
		GROUP BY ride_id
	)`;
}

function buildAnalysisJoins(analyses: readonly string[]) {
	return analyses.map((analysis) => {
		const cteName = analysisCteName(analysis);

		return `
		LEFT JOIN ${cteName}
			ON ${cteName}.ride_id = r._id`;
	}).join('');
}

function buildAnalysisSelectColumns(analyses: readonly string[]) {
	return analyses.map((analysis) => {
		const cteName = analysisCteName(analysis);

		return `

			${cteName}.grade_status
				AS _${cteName}_grade,

			${cteName}.reason
				AS _${cteName}_reason`;
	}).join('');
}

function buildAnalysisMap(analyses: readonly string[]) {
	const keys = analyses.map(analysis => `'${analysis}'`).join(',\n\t\t\t');
	const values = analyses.map((analysis) => {
		const cteName = analysisCteName(analysis);

		return `
			if(
				operational_status IN ('scheduled', 'running'),
				map(
					'grade', CAST(NULL AS Nullable(String)),
					'reason', CAST(NULL AS Nullable(String))
				),
				map(
					'grade', _${cteName}_grade,
					'reason', _${cteName}_reason
				)
			)`;
	}).join(',\n\t\t\t');

	return `
		mapFromArrays(
			[${keys}],
			[${values}]
		) AS analysis`;
}

export function buildRidesWithAnalysesQuery(analyses: readonly string[] = REQUIRED_ANALYSES) {
	if (analyses.length === 0) {
		throw new Error('buildRidesWithAnalysesQuery requires at least one analysis');
	}

	return `
WITH

	/*
	 * Capture the current time once so all derived statuses use exactly
	 * the same timestamp.
	 */
	toUnixTimestamp64Milli(now64(3)) AS now_ms,

	/*
	 * -----------------------------------------------------------------------
	 * Latest Ride version
	 * -----------------------------------------------------------------------
	 *
	 * Rides use ReplacingMergeTree(updated_at).
	 *
	 * Select the latest physical version explicitly instead of using FINAL.
	 *
	 * The scheduled start time range is applied before LIMIT BY so that
	 * ClickHouse can discard irrelevant data as early as possible.
	 */
	rides_latest AS
	(
		SELECT
			*
		FROM operation.rides
		WHERE
			start_time_scheduled >= $1
			AND start_time_scheduled <= $2
		ORDER BY
			updated_at DESC
		LIMIT 1 BY _id
	),

	/*
	 * -----------------------------------------------------------------------
	 * Latest analysis versions
	 * -----------------------------------------------------------------------
	 *
	 * Each analysis table uses ReplacingMergeTree(updated_at).
	 *
	 * argMax() returns the grade and reason from the latest version without
	 * requiring FINAL.
	 *
	 * Only rides in the selected date range are considered.
	 */
${analyses.map(buildAnalysisCte).join(',\n')},

	/*
	 * -----------------------------------------------------------------------
	 * Join the latest Ride with the latest analysis results.
	 * -----------------------------------------------------------------------
	 */
	ride_with_analyses AS
	(
		SELECT
			r.*,${buildAnalysisSelectColumns(analyses)}

		FROM rides_latest AS r
${buildAnalysisJoins(analyses)}
	),

	/*
	 * -----------------------------------------------------------------------
	 * Calculate derived statuses.
	 * -----------------------------------------------------------------------
	 */
	ride_with_statuses AS
	(
		SELECT
			*,

			/*
			 * Operational status
			 */
			CASE
				WHEN
					seen_last_at IS NULL
					AND now_ms - start_time_scheduled <= 600000
				THEN 'scheduled'

				WHEN
					seen_last_at IS NULL
					AND now_ms - start_time_scheduled > 600000
				THEN 'missed'

				WHEN
					seen_last_at IS NOT NULL
					AND now_ms - seen_last_at <= 600000
				THEN 'running'

				ELSE 'ended'
			END AS operational_status

		FROM ride_with_analyses
	)

SELECT
	_id,
	operational_status,
	route_short_name,${buildAnalysisMap(analyses)}

FROM ride_with_statuses

ORDER BY
	start_time_scheduled ASC,
	_id ASC;
`;
}
