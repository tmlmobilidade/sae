/* * */

import { LineSchema } from '@tmlmobilidade/go-types-offer';
import { z } from 'zod';

/* * */

export const PlanLineItemSchema = LineSchema.pick({
	_id: true,
	agency_id: true,
	code: true,
	name: true,
});

/**
 * The item schema for listing lines available to Plans poster exports.
 */
export type PlanLineItem = z.infer<typeof PlanLineItemSchema>;
