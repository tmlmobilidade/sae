/* * */

import { FileExportBaseSchema } from '@/base.js';
import { z } from 'zod';

/* * */

export const PlanPostersContentModeSchema = z.enum(['all', 'lines', 'stops']);
export const PlanPostersFilterModeSchema = z.enum(['exclude', 'include']);

/* PROPERTIES SCHEMA */
/* * */
export const PlanPostersExportPropertiesSchema = z.object({
	properties: z.object({
		agency_id: z.string(),
		canvas_profile: z.enum(['0Master.A', '0Master.B', '0Master.C', '0Master.F']).nullish(),
		content_mode: PlanPostersContentModeSchema.optional(),
		line_ids: z.array(z.string()).optional(),
		lines_mode: PlanPostersFilterModeSchema.optional(),
		plan_id: z.string(),
		stop_ids: z.array(z.string()).optional(),
		stops_mode: PlanPostersFilterModeSchema.optional(),
	}),
	type: z.literal('plan_posters'),
});

/* CREATE SCHEMA */
/* * */
export const PlanPostersExportSchema = FileExportBaseSchema.extend(PlanPostersExportPropertiesSchema.shape);

/* TYPES */
/* * */
export type PlanPostersContentMode = z.infer<typeof PlanPostersContentModeSchema>;
export type PlanPostersFilterMode = z.infer<typeof PlanPostersFilterModeSchema>;
export type PlanPostersExportProperties = z.infer<typeof PlanPostersExportPropertiesSchema>;
