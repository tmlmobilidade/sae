/* * */

import { validateRides } from '@/tasks/validate-rides.js';

/* * */

const MAX_RUN_INTERVAL = 1000; // 100 milliseconds

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await validateRides();
		setTimeout(runOnInterval, Math.random() * MAX_RUN_INTERVAL); // Run between 0 and MAX_RUN_INTERVAL milliseconds
	};

	runOnInterval();

	//
})();
