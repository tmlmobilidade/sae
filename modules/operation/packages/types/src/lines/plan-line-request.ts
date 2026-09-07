/* * */

import { PermissionsRegistrySchema } from '@tmlmobilidade/go-types-permissions';
import { z } from 'zod';

/* * */

export const PlanLineRequestSchema = z.object({
	agency_id: z.string(),
	permissions: PermissionsRegistrySchema,
});

/**
 * The request schema for listing lines available to Plans poster exports.
 */
export type PlanLineRequest = z.infer<typeof PlanLineRequestSchema>;
