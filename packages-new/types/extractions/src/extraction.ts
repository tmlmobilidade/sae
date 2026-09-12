/* * */

import { z } from 'zod';

import { InfrastructureStopsV1ExtractionSchema } from './modules/infrastructure/stops/v1/extraction.js';

/* * */

export const ExtractionSchema = z.discriminatedUnion('version', [
	InfrastructureStopsV1ExtractionSchema,
]);

export type Extraction = z.infer<typeof ExtractionSchema>;
