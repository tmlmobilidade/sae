/* * */

import { ensureParity } from '@/tasks/ensure-parity.js';
import { watchChanges } from '@/tasks/watch-changes.js';

/* * */

const RUN_INTERVAL = 1800000; // 30 minutes

/* * */

(async function init() {
	//

	//
	// Watch for changes to the MongoDB collection
	// and integrate those documents immediately.

	await watchChanges();

	//
	// At the same time, ensure that all documents are synced
	// by checking the presence of each individual document ID.

	const runOnInterval = async () => {
		await ensureParity();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
