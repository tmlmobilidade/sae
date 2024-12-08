/* * */

import { syncApexT19 } from '@/tasks/sync-apex-t19.js';

/* * */

const RUN_INTERVAL = 1800000; // 30 minutes

/* * */

(async function init() {
	//

	//
	// Ensure that all documents are synced between collections
	// by checking the presence of each individual document ID.

	const runOnInterval = async () => {
		await syncApexT19();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
