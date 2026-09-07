/* * */

import { PermissionsRegistrySchema } from '@tmlmobilidade/go-types-permissions';
import { z } from 'zod';

/* * */

export const PlansLinesRequestSchema = z.object({
	agency_id: z.string(),
	permissions: PermissionsRegistrySchema,
});

/**
 * The request schema for listing lines available to Plans poster exports.
 */
export type PlansLinesRequest = z.infer<typeof PlansLinesRequestSchema>;
