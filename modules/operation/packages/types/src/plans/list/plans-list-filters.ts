/* * */

import { TemporalStatusSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const PlansListFiltersSchema = z.object({

	agency_ids: z
		.array(z.string())
		.default([]),

	search: z
		.string()
		.optional(),

	temporal_statuses: z
		.array(TemporalStatusSchema)
		.optional(),

});

export type PlansListFilters = z.infer<typeof PlansListFiltersSchema>;
