/* * */

import { extractInfrastructureStopsV1 } from '@tmlmobilidade/go-extractions-infrastructure-stops';
import { type Extraction, type ExtractionTaskContext, type ExtractionTaskResult } from '@tmlmobilidade/go-types-extractions';

/* * */

export const VERSIONS_MAP: Record<Extraction['version'], (context: ExtractionTaskContext, extraction: Extraction) => Promise<ExtractionTaskResult>> = {
	'infrastructure-stops-v1': extractInfrastructureStopsV1,
};
