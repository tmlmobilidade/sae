/* * */

import { createRidesFromGtfs } from '@/tasks/createRidesFromGtfs.js';

/* * */

const RUN_INTERVAL = 60000; // 1 minute

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await createRidesFromGtfs();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
