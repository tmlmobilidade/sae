/* * */

import { z } from 'zod';

import { ExtractionBaseSchema } from '../../base.js';

/* * */

export const InfrastructureStopsV1ExtractionSchema = ExtractionBaseSchema.extend({
	version: z.literal('infrastructure-stops-v1'),
});

export type InfrastructureStopsV1Extraction = z.infer<typeof InfrastructureStopsV1ExtractionSchema>;
