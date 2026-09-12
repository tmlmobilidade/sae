/* * */

import { getCurrentEnvironment } from '@tmlmobilidade/go-types-shared';

/**
 * Get the coordinator URL for the given endpoint.
 * @param endpoint The endpoint to get the coordinator URL for.
 * @returns The coordinator URL for the given endpoint.
 */
export function getExtractionsCoordinatorUrl(endpoint: 'extractions'): string {
	//

	const currentEnvironment = getCurrentEnvironment();

	if (currentEnvironment === 'dev') return `http://localhost:5050/${endpoint}`;

	return `http://${currentEnvironment}-core-extractions-coordinator.${currentEnvironment}-core.svc.cluster.local/${endpoint}`;
}
