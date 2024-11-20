/* * */

class TIMETRACKER {
	//

	constructor() {
		this.startTime = Date.now();
	}

	get() {
		//

		const elapsedTime = Date.now() - this.startTime;

		const milliseconds = elapsedTime % 1000;
		const seconds = Math.floor(elapsedTime / 1000) % 60;
		const minutes = Math.floor(elapsedTime / (1000 * 60)) % 60;
		const hours = Math.floor(elapsedTime / (1000 * 60 * 60));

		let string = '';

		if (hours > 0) string += `${hours}h `;
		if (minutes > 0) string += `${minutes}m `;
		if (seconds > 0) string += `${seconds}s `;
		if (milliseconds > 0) string += `${milliseconds}ms`;

		return string;

		//
	}

	//
}

/* * */

export default TIMETRACKER;
