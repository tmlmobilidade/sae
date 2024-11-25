/* * */

import 'dotenv/config';
import syncValidations from '@/tasks/sync-validations.js';

/* * */

const RUN_INTERVAL = 3600000; // 60 minutes

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await syncValidations();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
