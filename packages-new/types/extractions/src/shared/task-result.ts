/* * */

import { z } from 'zod';

/* * */

export const ExtractionTaskResultSchema = z.object({
	attachment_name: z.string(),
});

export type ExtractionTaskResult = z.infer<typeof ExtractionTaskResultSchema>;
