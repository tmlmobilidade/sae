/* * */

import { UnixMillisecondsSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const ExtractionWorkerResultSchema = z.object({
	duration: UnixMillisecondsSchema.nullable().default(null),
	path: z.string(),
	size: z.number(),
});

export type ExtractionWorkerResult = z.infer<typeof ExtractionWorkerResultSchema>;
