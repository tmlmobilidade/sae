/* * */

import { reprocessStuckRides } from '@/tasks/reprocess-stuck-rides.js';

/* * */

const RUN_INTERVAL = 10000; // 10 seconds

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await reprocessStuckRides();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
