/* * */

import { z } from 'zod';

/* * */

export const ExtractionTaskContextSchema = z.object({
	output_path: z.string(),
});

export type ExtractionTaskContext = z.infer<typeof ExtractionTaskContextSchema>;
