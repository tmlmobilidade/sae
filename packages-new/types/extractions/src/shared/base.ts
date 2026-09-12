/* * */

import { BaseDocumentSchema, ProcessingStatusSchema, UnixMillisecondsSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const ExtractionBaseSchema = BaseDocumentSchema.extend({
	attachment_id: z.string(),
	downloaded_at: UnixMillisecondsSchema,
	processing_status: ProcessingStatusSchema,
	retries: z.number().min(0).max(3).default(0),
	send_email_notification: z.boolean().default(true),
});

export type ExtractionBase = z.infer<typeof ExtractionBaseSchema>;
