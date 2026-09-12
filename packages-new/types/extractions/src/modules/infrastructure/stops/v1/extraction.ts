/* * */

import { z } from 'zod';

import { ExtractionBaseSchema } from '../../../../shared/base.js';
import { InfrastructureStopsV1ExtractionCreateSchema } from './create.js';

/* * */

export const InfrastructureStopsV1ExtractionSchema = ExtractionBaseSchema
	.merge(InfrastructureStopsV1ExtractionCreateSchema);

export type InfrastructureStopsV1Extraction = z.infer<typeof InfrastructureStopsV1ExtractionSchema>;
