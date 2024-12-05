/* * */

import PCGIDB from '@/services/PCGIDB.js';
import { processApexT11 } from '@/tasks/process-apex-t11.js';
import { processApexT19 } from '@/tasks/process-apex-t19.js';
import { processVehicleEvent } from '@/tasks/process-vehicle-event.js';

/* * */

(async function init() {
	//

	await PCGIDB.connect();

	//
	// Watch for changes to the MongoDB collections
	// and integrate those documents immediately.

	PCGIDB.ValidationEntity.watch().on('change', processApexT11);

	PCGIDB.LocationEntity.watch().on('change', processApexT19);

	PCGIDB.VehicleEvents.watch().on('change', processVehicleEvent);

	//
})();
