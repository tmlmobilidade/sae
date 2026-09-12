/* * */

import { z } from 'zod';

import { InfrastructureStopsV1ExtractionCreateSchema } from './modules/infrastructure/stops/v1/create.js';

/* * */

export const ExtractionCreateSchema = z.discriminatedUnion('version', [
	InfrastructureStopsV1ExtractionCreateSchema,
]);

export type ExtractionCreate = z.infer<typeof ExtractionCreateSchema>;
