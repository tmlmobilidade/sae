/* * */

import { syncApexT11 } from '@/tasks/sync-apex-t11.js';
import { syncApexT19 } from '@/tasks/sync-apex-t19.js';
import { syncVehicleEvents } from '@/tasks/sync-vehicle-events.js';

/* * */

const RUN_INTERVAL = 1800000; // 30 minutes

/* * */

(async function init() {
	//

	//
	// Ensure that all documents are synced between collections
	// by checking the presence of each individual document ID.

	const runOnInterval = async () => {
		await syncApexT11();
		await syncApexT19();
		await syncVehicleEvents();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
