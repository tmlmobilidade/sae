/* * */

import { z } from 'zod';

/**
 * A schema for non-negative floats.
 * It transforms the value to a number and ensures it is non-negative.
 * @throws if the value is negative or if it cannot be coerced to a number.
 * @example
 * ```ts
 * const schema = NonNegativeFloatSchema.parse(1);
 * // => 1
 * const schema = NonNegativeFloatSchema.parse(-1);
 * // => throws an error
 * const schema = NonNegativeFloatSchema.parse('1');
 * // => 1
 * const schema = NonNegativeFloatSchema.parse(0);
 * // => 0
 * const schema = NonNegativeFloatSchema.parse(1.5);
 * // => 1.5
 * const schema = NonNegativeFloatSchema.parse("1.567");
 * // => 1.567
 * const schema = NonNegativeFloatSchema.parse("-1.5");
 * // => throws an error
 * ```
 */
export const NonNegativeFloatSchema = z
	.union([z.string(), z.number()])
	.transform(value => Number(value))
	.pipe(z.number().nonnegative());

export type NonNegativeFloat = z.infer<typeof NonNegativeFloatSchema>;
