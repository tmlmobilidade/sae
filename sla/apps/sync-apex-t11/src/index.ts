/* * */

import { syncApexT11 } from '@/tasks/sync-apex-t11.js';

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
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
