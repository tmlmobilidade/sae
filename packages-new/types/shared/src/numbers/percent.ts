/* * */

import { z } from 'zod';

/**
 * A schema for percentages in the range 0-100,
 * It transforms the value to a number, rounds it
 * to the nearest integer, and ensures it is in the range 0-100.
 * @throws if the value cannot be coerced to a number or if it is not in the range 0-100.
 * @example
 * ```ts
 * const schema = PercentSchema.parse(50);
 * // => 50
 * const schema = PercentSchema.parse("75");
 * // => 75
 * const schema = PercentSchema.parse(101);
 * // => throws an error
 * const schema = PercentSchema.parse(-1);
 * // => throws an error
 * const schema = PercentSchema.parse("50.1");
 * // => 50
 * ```
 */
export const PercentSchema = z
	.union([z.string(), z.number()])
	.transform(value => Math.round(Number(value)))
	.pipe(z.number().int().min(0).max(100))
	.brand('Percent');

export type Percent = z.infer<typeof PercentSchema>;
