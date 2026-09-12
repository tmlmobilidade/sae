/* * */

import { z } from 'zod';

import { ExtractionBaseCreateSchema } from '../../../../shared/base-create.js';
import { InfrastructureStopsV1ExtractionPropertiesSchema } from './properties.js';

/* * */

export const InfrastructureStopsV1ExtractionCreateSchema = ExtractionBaseCreateSchema.extend({
	properties: InfrastructureStopsV1ExtractionPropertiesSchema,
	version: z.literal('infrastructure-stops-v1'),
});

export type InfrastructureStopsV1ExtractionCreate = z.infer<typeof InfrastructureStopsV1ExtractionCreateSchema>;
