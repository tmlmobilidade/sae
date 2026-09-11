import { Dates } from '@tmlmobilidade/go-utils-dates';
import { type RideExportData } from '@tmlmobilidade/go-types-downloads';
import { type RideAcceptance, type RideNormalized, type UnixMilliseconds } from '@tmlmobilidade/types';

function parseTime(time: null | UnixMilliseconds): null | string {
	if (!time) {
		return null;
	}

	return Dates.fromUnixMilliseconds(time).setZone('Europe/Lisbon', 'offset_only').toLocaleString(Dates.FORMATS.TIME_SIMPLE, 'pt-Pt');
}

export function parseRide(ride: RideNormalized & { acceptance: null | RideAcceptance }): RideExportData {
	return {
		/* META */
		/* * */
		_id: ride._id,
		agency_id: ride.agency_id,
		driver_ids: ride.driver_ids?.join('|') ?? null,
		headsign: ride.headsign,
		line_id: ride.line_id,
		pattern_id: ride.pattern_id,
		plan_id: ride.plan_id,
		route_id: ride.route_id,
		trip_id: ride.trip_id,
		vehicle_ids: ride.vehicle_ids?.join('|') ?? null,

		/* TIME & STATUS */
		/* * */
		operational_date: ride.operational_date,
		operational_status: ride.operational_status,
		//
		start_delay_status: ride.start_delay_status,
		start_time_observed: parseTime(ride.start_time_observed),
		start_time_scheduled: parseTime(ride.start_time_scheduled),
		//
		end_delay_status: ride.end_delay_status,
		end_time_observed: parseTime(ride.end_time_observed),
		end_time_scheduled: parseTime(ride.end_time_scheduled),
		extension_observed: ride.extension_observed,
		extension_scheduled: ride.extension_scheduled,
		//
		seen_first_at: parseTime(ride.seen_first_at),
		seen_last_at: parseTime(ride.seen_last_at),
		seen_status: ride.seen_status,

		/* PASSENGERS */
		/* * */
		passengers_estimated: ride.passengers_estimated,
		passengers_observed: ride.passengers_observed,
		passengers_observed_on_board_sales_amount: ride.passengers_observed_on_board_sales_amount,
		passengers_observed_on_board_sales_qty: ride.passengers_observed_on_board_sales_qty,
		passengers_observed_prepaid_amount: ride.passengers_observed_prepaid_amount,
		passengers_observed_prepaid_qty: ride.passengers_observed_prepaid_qty,
		passengers_observed_subscription_qty: ride.passengers_observed_subscription_qty,

		/* APEX */
		/* * */
		apex_locations_qty: ride.apex_locations_qty,
		apex_on_board_refunds_amount: ride.apex_on_board_refunds_amount,
		apex_on_board_refunds_qty: ride.apex_on_board_refunds_qty,
		apex_on_board_sales_amount: ride.apex_on_board_sales_amount,
		apex_on_board_sales_qty: ride.apex_on_board_sales_qty,
		apex_validations_qty: ride.apex_validations_qty,

		/* ANALYSIS */
		/* * */
		analysis_AT_LEAST_ONE_VEHICLE_EVENT_ON_FIRST_STOP: ride.analysis?.AT_LEAST_ONE_VEHICLE_EVENT_ON_FIRST_STOP?.grade ?? null,
		analysis_ENDED_AT_LAST_STOP: ride.analysis?.ENDED_AT_LAST_STOP?.grade ?? null,
		analysis_EXPECTED_APEX_VALIDATION_INTERVAL: ride.analysis?.EXPECTED_APEX_VALIDATION_INTERVAL?.grade ?? null,
		analysis_EXPECTED_DRIVER_ID_QTY: ride.analysis?.EXPECTED_DRIVER_ID_QTY?.grade ?? null,
		analysis_EXPECTED_START_TIME: ride.analysis?.EXPECTED_START_TIME?.grade ?? null,
		analysis_EXPECTED_START_TIME_value: ride.analysis?.EXPECTED_START_TIME?.value ?? null,
		analysis_EXPECTED_VEHICLE_EVENT_DELAY: ride.analysis?.EXPECTED_VEHICLE_EVENT_DELAY?.grade ?? null,
		analysis_EXPECTED_VEHICLE_EVENT_INTERVAL: ride.analysis?.EXPECTED_VEHICLE_EVENT_INTERVAL?.grade ?? null,
		analysis_EXPECTED_VEHICLE_EVENT_QTY: ride.analysis?.EXPECTED_VEHICLE_EVENT_QTY?.grade ?? null,
		analysis_EXPECTED_VEHICLE_EVENT_QTY_expected_qty: ride.analysis?.EXPECTED_VEHICLE_EVENT_QTY?.expected_qty ?? null,
		analysis_EXPECTED_VEHICLE_EVENT_QTY_found_qty: ride.analysis?.EXPECTED_VEHICLE_EVENT_QTY?.found_qty ?? null,
		analysis_EXPECTED_VEHICLE_ID_QTY: ride.analysis?.EXPECTED_VEHICLE_ID_QTY?.grade ?? null,
		analysis_MATCHING_APEX_LOCATIONS: ride.analysis?.MATCHING_APEX_LOCATIONS?.grade ?? null,
		analysis_MATCHING_VEHICLE_IDS: ride.analysis?.MATCHING_VEHICLE_IDS?.grade ?? null,
		analysis_SIMPLE_ONE_APEX_VALIDATION: ride.analysis?.SIMPLE_ONE_APEX_VALIDATION?.grade ?? null,
		analysis_SIMPLE_ONE_VEHICLE_EVENT_OR_APEX_VALIDATION: ride.analysis?.SIMPLE_ONE_VEHICLE_EVENT_OR_APEX_VALIDATION?.grade ?? null,
		analysis_SIMPLE_THREE_VEHICLE_EVENTS: ride.analysis?.SIMPLE_THREE_VEHICLE_EVENTS?.grade ?? null,
		analysis_SIMPLE_THREE_VEHICLE_EVENTS_reason: ride.analysis?.SIMPLE_THREE_VEHICLE_EVENTS?.reason ?? null,
		analysis_SIMPLE_THREE_VEHICLE_EVENTS_stop_ids_first: ride.analysis?.SIMPLE_THREE_VEHICLE_EVENTS?.stop_ids_first?.join('|') ?? null,
		analysis_SIMPLE_THREE_VEHICLE_EVENTS_stop_ids_last: ride.analysis?.SIMPLE_THREE_VEHICLE_EVENTS?.stop_ids_last?.join('|') ?? null,
		analysis_SIMPLE_THREE_VEHICLE_EVENTS_stop_ids_middle: ride.analysis?.SIMPLE_THREE_VEHICLE_EVENTS?.stop_ids_middle?.join('|') ?? null,
		analysis_TRANSACTION_SEQUENTIALITY: ride.analysis?.TRANSACTION_SEQUENTIALITY?.grade ?? null,
		analysis_TRANSACTION_SEQUENTIALITY_expected_qty: ride.analysis?.TRANSACTION_SEQUENTIALITY?.expected_qty ?? null,
		analysis_TRANSACTION_SEQUENTIALITY_found_qty: ride.analysis?.TRANSACTION_SEQUENTIALITY?.found_qty ?? null,
		analysis_TRANSACTION_SEQUENTIALITY_missing_qty: ride.analysis?.TRANSACTION_SEQUENTIALITY?.missing_qty ?? null,

		/* ACCEPTANCE / JUSTIFICATION */
		/* * */
		acceptance_status: ride.acceptance?.acceptance_status,
		justification_cause: ride.acceptance?.justification?.justification_cause,
		justification_source: ride.acceptance?.justification?.justification_source,
		manual_trip_id: ride.acceptance?.justification?.manual_trip_id?.replaceAll('\n', ' ')?.replaceAll(',', ' ')?.replaceAll(';', ' ')?.replaceAll('  ', ' '),
		pto_message: ride.acceptance?.justification?.pto_message?.replaceAll('\n', ' ')?.replaceAll(',', ' ')?.replaceAll(';', ' ')?.replaceAll('  ', ' '),
	};
}
