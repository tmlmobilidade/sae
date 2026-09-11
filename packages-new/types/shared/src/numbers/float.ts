/* * */

import { z } from 'zod';

/**
 * A schema for floats.
 * It transforms the value to a number.
 * @throws if the value cannot be coerced to a number.
 * @example
 * ```ts
 * const schema = FloatSchema.parse(1);
 * // => 1
 * const schema = FloatSchema.parse(-1);
 * // => -1
 * const schema = FloatSchema.parse('1');
 * // => 1
 * const schema = FloatSchema.parse("1.5");
 * // => 1.5
 * const schema = FloatSchema.parse("-1.5");
 * // => -1.5
 * const schema = FloatSchema.parse("-1.501");
 * // => -1.501
 * ```
 */
export const FloatSchema = z
	.union([z.string(), z.number()])
	.transform(value => Number(value));

export type Float = z.infer<typeof FloatSchema>;
