/* * */

import { z } from 'zod';

import { InfrastructureStopsV1ExtractionSchema } from './infrastructure/stops/v1.js';

/* * */

export const ExtractionSchema = z.discriminatedUnion('version', [
	InfrastructureStopsV1ExtractionSchema,
]);

export type Extraction = z.infer<typeof ExtractionSchema>;
