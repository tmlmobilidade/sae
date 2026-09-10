/* * */

import { z } from 'zod';

/**
 * A schema for degrees in the range 0-360,
 * It transforms the value to a number, rounds it
 * to the nearest integer, and ensures it is in the range 0-360.
 * @throws if the value cannot be coerced to a number or if it is not in the range 0-360.
 * @example
 * ```ts
 * const schema = DegreesSchema.parse(50);
 * // => 50
 * const schema = DegreesSchema.parse("75");
 * // => 75
 * const schema = DegreesSchema.parse(360);
 * // => 0
 * const schema = DegreesSchema.parse(361);
 * // => throws an error
 * const schema = DegreesSchema.parse(-1);
 * // => throws an error
 * const schema = DegreesSchema.parse("50.1");
 * // => 50
 * ```
 */
export const DegreesSchema = z
	.union([z.string(), z.number()])
	.transform(value => Math.round(Number(value)))
	.transform(value => value === 360 ? 0 : value)
	.pipe(z.number().int().min(0).lt(360))
	.brand('Degrees');

export type Degrees = z.infer<typeof DegreesSchema>;
