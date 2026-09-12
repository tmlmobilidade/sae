/* * */

import { z } from 'zod';

/* * */

export const InfrastructureStopsV1ExtractionPropertiesSchema = z.object({
	municipality_ids: z.array(z.string()).optional(),
});

export type InfrastructureStopsV1ExtractionProperties = z.infer<typeof InfrastructureStopsV1ExtractionPropertiesSchema>;
