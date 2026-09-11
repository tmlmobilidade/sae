/* * */

import { extractInfrastructureStopsV1 } from '@tmlmobilidade/go-extractions-infrastructure-stops';
import { Extraction, ExtractionWorkerResult } from '@tmlmobilidade/go-types-extractions';

/* * */

export const VERSIONS_MAP: Record<Extraction['version'], (properties: Extraction['properties']) => null | Promise<ExtractionWorkerResult>> = {
	'infrastructure-stops-v1': extractInfrastructureStopsV1,
};
