/* * */

import { BaseDocumentSchema, ProcessingStatusSchema, UnixMillisecondsSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const ExtractionBaseSchema = BaseDocumentSchema.extend({
	attachment_id: z.string(),
	downloaded_at: UnixMillisecondsSchema,
	processing_status: ProcessingStatusSchema,
});

export type ExtractionBase = z.infer<typeof ExtractionBaseSchema>;
