/* * */

import { z } from 'zod';

import { ExtractionBaseSchema } from '../../shared/base.js';

/* * */

export const InfrastructureStopsV1ExtractionPropertiesSchema = z.object({
	municipality_ids: z.array(z.string()).optional(),
});

export type InfrastructureStopsV1ExtractionProperties = z.infer<typeof InfrastructureStopsV1ExtractionPropertiesSchema>;

/* * */

export const InfrastructureStopsV1ExtractionSchema = ExtractionBaseSchema.extend({
	properties: InfrastructureStopsV1ExtractionPropertiesSchema,
	version: z.literal('infrastructure-stops-v1'),
});

export type InfrastructureStopsV1Extraction = z.infer<typeof InfrastructureStopsV1ExtractionSchema>;
