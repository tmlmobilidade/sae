/* * */

import { BaseDocumentSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const AttachmentSchema = BaseDocumentSchema
	.omit({ is_locked: true })
	.extend({
		description: z.string().nullish(),
		metadata: z.record(z.unknown()).nullish(),
		name: z.string(),
		resource_id: z.string(),
		scope: z.string(),
		size: z.number().describe('size in bytes'),
		type: z.string().describe('mime type'),
		url: z.string().nullish(),
	});

export const CreateAttachmentSchema = AttachmentSchema.omit({ _id: true, created_at: true, updated_at: true });
export const UpdateAttachmentSchema = CreateAttachmentSchema.omit({ created_by: true }).partial();

export type Attachment = z.infer<typeof AttachmentSchema>;
export type CreateAttachmentDto = z.infer<typeof CreateAttachmentSchema>;
export type UpdateAttachmentDto = z.infer<typeof UpdateAttachmentSchema>;
