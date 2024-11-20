/* * */

import 'dotenv/config';

import start from './start.js';

/* * */

const RUN_INTERVAL = 3600000; // 60 minutes

/* * */

(async function init() {
	//

	const runOnInterval = async () => {
		await start();
		setTimeout(runOnInterval, RUN_INTERVAL);
	};

	runOnInterval();

	//
})();
