/* * */

import { type SimplifiedMongoIndex } from '@tmlmobilidade/go-clients-mongo';
import { type Extraction } from '@tmlmobilidade/go-types-extractions';

/* * */

export const extractionsIndexes: SimplifiedMongoIndex<Extraction>[] = [
	{ key: { updated_at: -1 } },
	{ key: { processing_status: 1 } },
];
