/* * */

import { z } from 'zod';

/* * */

export const ExtractionBaseCreateSchema = z.object({
	send_email_notification: z.boolean().default(true),
});

export type ExtractionBaseCreate = z.infer<typeof ExtractionBaseCreateSchema>;
