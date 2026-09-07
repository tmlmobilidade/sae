/* * */

import { StopSchema } from '@tmlmobilidade/go-types-infrastructure';
import { z } from 'zod';

/* * */

export const PlanStopItemSchema = StopSchema.pick({
	_id: true,
	name: true,
	short_name: true,
}).extend({
	stop_id: z.string(),
});

/**
 * The item schema for listing stops available to Plans poster exports.
 */
export type PlanStopItem = z.infer<typeof PlanStopItemSchema>;
