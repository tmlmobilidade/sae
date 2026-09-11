/* * */

import { type FastifyReply, type FastifyRequest, sendErrorApiResponse, sendSuccessApiResponse } from '@tmlmobilidade/go-clients-fastify';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type ControllerRidesListFilters, ControllerRidesListFiltersSchema, type ControllerRidesListItem } from '@tmlmobilidade/go-operation-pckg-types';
import { PermissionCatalog } from '@tmlmobilidade/go-types-permissions';
import { sqlPath } from '@tmlmobilidade/go-utils-sql';
import { readFile } from 'node:fs/promises';

/**
 * Get rides by query.
 * @param request The Fastify request object.
 * @param reply The Fastify reply object.
 */
export async function listRidesHandler(request: FastifyRequest<{ Body: ControllerRidesListFilters }>, reply: FastifyReply<ControllerRidesListItem[]>) {
	//

	//
	// Apply permission filters to the request body

	request.body.agency_ids = PermissionCatalog.filterPermissionResourceValues<string>({
		action: PermissionCatalog.all.rides.actions.analysis_read,
		permissions: request.permissions,
		resourceKey: 'agency_ids',
		scope: PermissionCatalog.all.rides.scope,
		values: request.body.agency_ids,
	});

	//
	// Validate the filters

	const validatedFilters = ControllerRidesListFiltersSchema.parse(request.body);

	//
	// If any of the required filters are empty arrays,
	// then there is no data to return, so return an empty array.

	const hasEmptyFilter = [
		validatedFilters.agency_ids,
		validatedFilters.acceptance_statuses,
		validatedFilters.analysis_at_least_one_vehicle_event_on_last_stop_grades,
		validatedFilters.analysis_expected_apex_validation_interval_grades,
		validatedFilters.analysis_simple_three_vehicle_events_grades,
		validatedFilters.analysis_transaction_sequentiality_grades,
		validatedFilters.start_delay_statuses,
		validatedFilters.end_delay_statuses,
		validatedFilters.operational_statuses,
		validatedFilters.route_short_names,
		validatedFilters.ticketing_statuses,
	].some(value => Array.isArray(value) && value.length === 0);

	if (hasEmptyFilter) return [];

	//
	// Build query parameters

	const params: Record<string, number | string> = {
		1: validatedFilters.start_time_scheduled_start,
		2: validatedFilters.start_time_scheduled_end,
		3: validatedFilters.search ?? '',
	};

	let paramIndex = 4;

	const addParam = (value: number | string): string => {
		const index = paramIndex++;
		params[String(index)] = value;
		return `$${index}`;
	};

	//
	// Build WHERE conditions

	const conditions: string[] = [];

	//
	// Agency IDs

	if (validatedFilters.agency_ids.length) {
		const placeholders = validatedFilters.agency_ids.map(addParam);
		conditions.push(`agency_id IN (${placeholders.join(', ')})`);
	}

	//
	// Route short names

	if (validatedFilters.route_short_names?.length) {
		const placeholders = validatedFilters.route_short_names.map(addParam);
		conditions.push(`route_short_name IN (${placeholders.join(', ')})`);
	}

	//
	// Driver IDs

	if (validatedFilters.driver_ids?.length) {
		const placeholders = validatedFilters.driver_ids.map(addParam);
		conditions.push(`hasAny(driver_ids, [${placeholders.join(', ')}])`);
	}

	//
	// Vehicle IDs

	if (validatedFilters.vehicle_ids?.length) {
		const placeholders = validatedFilters.vehicle_ids.map(addParam);
		conditions.push(`hasAny(vehicle_ids, [${placeholders.join(', ')}])`);
	}

	//
	// Operational statuses

	if (validatedFilters.operational_statuses?.length) {
		const placeholders = validatedFilters.operational_statuses.map(addParam);
		conditions.push(
			`operational_status IN (${placeholders.join(', ')})`,
		);
	}

	//
	// Delay statuses
	//
	// `none` represents a NULL delay status in ClickHouse.
	//
	//   none          -> IS NULL
	//   delayed/...   -> IN (...)

	const addDelayStatusFilter = (column: string, values: Array<string>): void => {
		const statuses = values.filter(status => status !== 'none');
		const includesNone = values.includes('none');
		const delayConditions: string[] = [];
		if (statuses.length) {
			const placeholders = statuses.map(addParam);
			delayConditions.push(`${column} IN (${placeholders.join(', ')})`);
		}
		if (includesNone) delayConditions.push(`${column} IS NULL`);
		conditions.push(`(${delayConditions.join('\n\t\t\tOR ')})`);
	};

	if (validatedFilters.start_delay_statuses?.length) {
		addDelayStatusFilter('start_delay_status', validatedFilters.start_delay_statuses);
	}

	if (validatedFilters.end_delay_statuses?.length) {
		addDelayStatusFilter('end_delay_status', validatedFilters.end_delay_statuses);
	}

	//
	// Analysis grades
	//
	// `none` represents a NULL analysis grade in the database.
	//
	//   none          -> IS NULL
	//   pass/fail/... -> IN (...)

	const addGradeFilter = (column: string, values: Array<string>): void => {
		const grades = values.filter(grade => grade !== 'none');
		const includesNone = values.includes('none');
		const gradeConditions: string[] = [];
		if (grades.length) {
			const placeholders = grades.map(addParam);
			gradeConditions.push(`${column} IN (${placeholders.join(', ')})`);
		}
		if (includesNone) gradeConditions.push(`${column} IS NULL`);
		conditions.push(`(${gradeConditions.join('\n\t\t\tOR ')})`);
	};

	if (validatedFilters.analysis_at_least_one_vehicle_event_on_last_stop_grades?.length) {
		addGradeFilter('analysis_at_least_one_vehicle_event_on_last_stop_grade', validatedFilters.analysis_at_least_one_vehicle_event_on_last_stop_grades);
	}

	if (validatedFilters.analysis_expected_apex_validation_interval_grades?.length) {
		addGradeFilter('analysis_expected_apex_validation_interval_grade', validatedFilters.analysis_expected_apex_validation_interval_grades);
	}

	if (validatedFilters.analysis_simple_three_vehicle_events_grades?.length) {
		addGradeFilter('analysis_simple_three_vehicle_events_grade', validatedFilters.analysis_simple_three_vehicle_events_grades);
	}

	if (validatedFilters.analysis_transaction_sequentiality_grades?.length) {
		addGradeFilter('analysis_transaction_sequentiality_grade', validatedFilters.analysis_transaction_sequentiality_grades);
	}

	//
	// Search

	if (validatedFilters.search) {
		const search = validatedFilters.search.trim();
		const partialSearch = addParam(`%${search}%`);
		conditions.push(`
			(
				_id ILIKE ${partialSearch}
				OR headsign ILIKE ${partialSearch}
			)
		`);
	}

	//
	// Append the dynamic filters to the query

	const where = conditions.length
		? `\n\tAND ${conditions.join('\n\tAND ')}`
		: '';

	const queryTemplate = await readFile(sqlPath('operation', 'rides/list-rides.sql'), 'utf-8');
	const sql = queryTemplate.replace('--DYNAMIC FILTERS HERE--', where);

	const queryResult = await labDb.queryFromString<ControllerRidesListItem>(sql, params);

	//
	// Parse and return the result

	if (!queryResult?.length) {
		return sendErrorApiResponse(reply, {
			error: 'No rides found matching the filters',
			status_code: '404',
		});
	}

	return sendSuccessApiResponse(reply, queryResult);
}
