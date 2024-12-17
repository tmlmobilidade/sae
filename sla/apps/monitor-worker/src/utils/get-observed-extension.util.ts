/* * */

import { VehicleEvent } from '@tmlmobilidade/services/types';

/**
 * The observed extension is the distance between the odomoter values of the first and last events.
 * @param startEvent
 * @param endEvent
 * @returns The observed extension in meters
 */
export function getObservedExtension(startEvent: VehicleEvent, endEvent: VehicleEvent): null | number {
	//

	if (!startEvent || !startEvent.odometer) {
		// throw new Error('Start event must be provided and should have a valid odometer value.');
		return null;
	}

	if (!endEvent || !endEvent.odometer) {
		// throw new Error('End event must be provided and should have a valid odometer value.');
		return null;
	}

	const observedExtension = endEvent.odometer - startEvent.odometer;

	if (observedExtension < 0) {
		// throw new Error('Observed extension cannot be negative.');
		return null;
	}

	return observedExtension;

	//
}
