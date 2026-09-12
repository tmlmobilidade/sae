/* * */

import { BaseDocumentSchema, ProcessingStatusSchema, UnixMillisecondsSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const ExtractionBaseSchema = BaseDocumentSchema.extend({
	attachment_id: z.string().nullable().default(null),
	downloaded_at: UnixMillisecondsSchema.nullable().default(null),
	processing_status: ProcessingStatusSchema.default('waiting'),
	retries: z.number().min(0).max(3).default(0),
});

export type ExtractionBase = z.infer<typeof ExtractionBaseSchema>;
