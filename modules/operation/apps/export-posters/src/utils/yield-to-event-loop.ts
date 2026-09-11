/* * */

const ROWS_PER_EVENT_LOOP_YIELD = 1_000;

/**
 * Allow database and SSH keepalive timers to run during large synchronous exports.
 */
export async function yieldToEventLoop(rowCount?: number): Promise<void> {
	if (rowCount !== undefined && rowCount % ROWS_PER_EVENT_LOOP_YIELD !== 0) return;
	await new Promise<void>(resolve => setImmediate(resolve));
}
