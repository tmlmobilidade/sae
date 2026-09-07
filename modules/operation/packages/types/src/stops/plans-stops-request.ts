/* * */

import { PermissionsRegistrySchema } from '@tmlmobilidade/go-types-permissions';
import { z } from 'zod';

/* * */

export const PlanStopRequestSchema = z.object({
	agency_id: z.string(),
	permissions: PermissionsRegistrySchema,
});

/**
 * The request schema for listing stops available to Plans poster exports.
 */
export type PlanStopRequest = z.infer<typeof PlanStopRequestSchema>;
