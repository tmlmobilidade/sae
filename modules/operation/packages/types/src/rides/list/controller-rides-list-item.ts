/* * */

import { RideAcceptanceStatusSchema, RideSchema } from '@tmlmobilidade/go-types-operation';
import { DelayStatusSchema, GradeStatusSchema, OperationalStatusSchema, SeenStatusSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const ControllerRidesListItemSchema = RideSchema
	.pick({
		_id: true,
		agency_id: true,
		driver_ids: true,
		end_time_observed: true,
		end_time_scheduled: true,
		headsign: true,
		operational_date: true,
		passengers_observed: true,
		seen_last_at: true,
		shape_id: true,
		start_time_observed: true,
		start_time_scheduled: true,
		timezone: true,
		vehicle_ids: true,
	})
	.extend({
		acceptance_status: RideAcceptanceStatusSchema.nullable().default(null),
		analysis_at_least_one_vehicle_event_on_last_stop_grade: GradeStatusSchema.nullable().default(null),
		analysis_expected_apex_validation_interval_grade: GradeStatusSchema.nullable().default(null),
		analysis_simple_three_vehicle_events_grade: GradeStatusSchema.nullable().default(null),
		analysis_transaction_sequentiality_grade: GradeStatusSchema.nullable().default(null),
		end_delay_status: DelayStatusSchema.nullable().default(null),
		operational_status: OperationalStatusSchema,
		seen_status: SeenStatusSchema,
		start_delay_status: DelayStatusSchema.nullable().default(null),
	});

/**
 * A read model combining the canonical ride data with derived
 * data, including acceptance state, delay state, and analysis results.
 * It is intended for use in the controller module.
 */
export type ControllerRidesListItem = z.infer<typeof ControllerRidesListItemSchema>;
