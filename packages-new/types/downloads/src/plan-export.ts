/* * */

import { FileExportBaseSchema } from '@/base.js';
import { z } from 'zod';

/* * */

/** Exports the plan's attachments.operation_gtfs_normalized ZIP. */
export const PlanExportPropertiesSchema = z.object({
	properties: z.object({
		agency_id: z.string(),
		plan_id: z.string(),
	}),
	type: z.literal('plan'),
});

export const PlanExportSchema = FileExportBaseSchema.extend(PlanExportPropertiesSchema.shape);

export type PlanExportProperties = z.infer<typeof PlanExportPropertiesSchema>;
