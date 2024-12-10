/* * */

import 'dotenv/config';
import { syncRides } from '@/tasks/sync-rides.js';

/* * */

const RUN_INTERVAL = 3600000; // 60 minutes

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await syncRides();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
