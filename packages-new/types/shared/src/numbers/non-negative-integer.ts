/* * */

import { z } from 'zod';

/**
 * A schema for non-negative integers.
 * It transforms the value to a number, rounds it
 * to the nearest integer, and ensures it is non-negative.
 * @throws if the value is negative or if it cannot be coerced to a number.
 * @example
 * ```ts
 * const schema = NonNegativeIntegerSchema.parse(1);
 * // => 1
 * const schema = NonNegativeIntegerSchema.parse(-1);
 * // => throws an error
 * const schema = NonNegativeIntegerSchema.parse('1');
 * // => 1
 * const schema = NonNegativeIntegerSchema.parse(0);
 * // => 0
 * const schema = NonNegativeIntegerSchema.parse(1.4);
 * // => 1
 * const schema = NonNegativeIntegerSchema.parse("1.567");
 * // => 2
 * ```
 */
export const NonNegativeIntegerSchema = z
	.union([z.string(), z.number()])
	.transform(value => Math.round(Number(value)))
	.pipe(z.number().int().nonnegative());

export type NonNegativeInteger = z.infer<typeof NonNegativeIntegerSchema>;
