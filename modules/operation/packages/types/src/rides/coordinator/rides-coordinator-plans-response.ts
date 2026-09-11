/* * */

import { z } from 'zod';

/* * */

export const RidesCoordinatorPlansResponseSchema = z.object({
	plan_id: z.string().nullable(),
});

/**
 * The response schema for getting a plan ID.
 * It is intended for use in the rides module.
 */
export type RidesCoordinatorPlansResponse = z.infer<typeof RidesCoordinatorPlansResponseSchema>;
