/* * */

import { z } from 'zod';

/**
 * A schema for integers (positive or negative).
 * It transforms the value to a number and
 * rounds it to the nearest integer using `Math.round`.
 * @throws if the value cannot be coerced to a number.
 * @example
 * ```ts
 * const schema = IntegerSchema.parse(1);
 * // => 1
 * const schema = IntegerSchema.parse(-1);
 * // => -1
 * const schema = IntegerSchema.parse('1');
 * // => 1
 * const schema = IntegerSchema.parse(1.4);
 * // => 1
 * const schema = IntegerSchema.parse("1.5");
 * // => 2
 * const schema = IntegerSchema.parse("-1.5");
 * // => -1
 * const schema = IntegerSchema.parse("-1.501");
 * // => -2
 * ```
 */
export const IntegerSchema = z
	.union([z.string(), z.number()])
	.transform(value => Math.round(Number(value)))
	.pipe(z.number().int());

export type Integer = z.infer<typeof IntegerSchema>;
