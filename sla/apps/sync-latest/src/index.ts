/* * */

import PCGIDB from '@/services/PCGIDB.js';
import { processVehicleEvent } from '@/tasks/process-vehicle-event.js';

/* * */

(async function init() {
	//

	await PCGIDB.connect();

	//
	// Watch for changes to the MongoDB collection
	// and integrate those documents immediately.

	PCGIDB.VehicleEvents.watch().on('change', processVehicleEvent);

	//
})();
