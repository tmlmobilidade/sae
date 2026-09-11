/* * */

import { z } from 'zod';

import { InfrastructureStopsV1ExtractionSchema } from './infrastructure/stops/v1.js';

/* * */

export const ExtractionsRegistySchema = z.discriminatedUnion('version', [
	InfrastructureStopsV1ExtractionSchema,
]);

export type ExtractionsRegisty = z.infer<typeof ExtractionsRegistySchema>;
