/* * */

import { LineSchema } from '@tmlmobilidade/go-types-offer';
import { z } from 'zod';

/* * */

export const PlansLinesItemSchema = LineSchema.pick({
	_id: true,
	agency_id: true,
	code: true,
	name: true,
});

/**
 * The item schema for listing lines available to Plans poster exports.
 */
export type PlansLinesItem = z.infer<typeof PlansLinesItemSchema>;
