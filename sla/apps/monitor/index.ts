/* * */

import 'dotenv/config';

import start from './start.js';

/* * */

const RUN_INTERVAL = 100; // 100 milliseconds

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
