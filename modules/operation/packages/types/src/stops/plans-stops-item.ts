/* * */

import { StopSchema } from '@tmlmobilidade/go-types-infrastructure';
import { z } from 'zod';

/* * */

export const PlansStopsItemSchema = StopSchema.pick({
	_id: true,
	name: true,
	short_name: true,
}).extend({
	stop_id: z.string(),
});

/**
 * The item schema for listing stops available to Plans poster exports.
 */
export type PlansStopsItem = z.infer<typeof PlansStopsItemSchema>;
