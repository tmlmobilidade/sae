/* * */

import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';

export interface CachedData<T> {
	data: T
	timestamp: UnixMilliseconds
}
