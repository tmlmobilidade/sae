/* * */

import { z } from 'zod';

/* * */

export const ExtractionsCoordinatorResponseSchema = z.object({
	extraction_id: z.string().nullable(),
});

/**
 * The response schema for getting an extraction ID.
 * It is intended for use in the core module.
 */
export type ExtractionsCoordinatorResponse = z.infer<typeof ExtractionsCoordinatorResponseSchema>;
