/* * */

import { RideSchema } from '@tmlmobilidade/go-types-operation';
import { DelayStatusSchema, OperationalStatusSchema, SeenStatusSchema } from '@tmlmobilidade/go-types-shared';
import { z } from 'zod';

/* * */

export const ControllerRidesDetailRideItemSchema = RideSchema.extend({
	end_delay_status: DelayStatusSchema.nullable().default(null),
	operational_status: OperationalStatusSchema,
	seen_status: SeenStatusSchema,
	start_delay_status: DelayStatusSchema.nullable().default(null),
});

/**
 * A read model combining the canonical ride data with derived
 * data, including delay, seen and operational statuses.
 * It is intended for use in the controller module.
 */
export type ControllerRidesDetailRideItem = z.infer<typeof ControllerRidesDetailRideItemSchema>;
