/* * */

import { BaseDocumentSchema, ProcessingStatusSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const ExtractionBaseSchema = BaseDocumentSchema.extend({
	attachment_id: z.string(),
	processing_status: ProcessingStatusSchema,
});

export type ExtractionBase = z.infer<typeof ExtractionBaseSchema>;
