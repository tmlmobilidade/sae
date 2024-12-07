/* * */

import { validateRides } from '@/tasks/validate-rides.js';

/* * */

const RUN_INTERVAL = 1000; // 100 milliseconds

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await validateRides();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
