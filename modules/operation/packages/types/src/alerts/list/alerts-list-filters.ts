/* * */

import { AlertCauseSchema, AlertEffectSchema, AlertReferenceTypeSchema } from '@tmlmobilidade/go-types-operation';
import { PublishStatusSchema, UnixMillisecondsSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const AlertsListFiltersSchema = z.object({

	active_period_filter_end: UnixMillisecondsSchema
		.optional(),

	active_period_filter_start: UnixMillisecondsSchema
		.optional(),

	agency_ids: z
		.array(z.string())
		.default([]),

	causes: z
		.array(AlertCauseSchema)
		.default([]),

	effects: z
		.array(AlertEffectSchema)
		.default([]),

	publish_date_filter_end: UnixMillisecondsSchema,

	publish_date_filter_start: UnixMillisecondsSchema,

	publish_status: z
		.array(PublishStatusSchema)
		.default([]),

	reference_type: z
		.array(AlertReferenceTypeSchema)
		.default([]),

});

/**
 * The filters schema for getting alerts.
 * It is intended for use in the alerts module.
 */
export type AlertsListFilters = z.infer<typeof AlertsListFiltersSchema>;
