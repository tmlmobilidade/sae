/* * */

/**
 * Get the letter index for a given sequence number.
 * @param index - The sequence number to get the letter index for.
 * @returns The letter index.
 */
export function getLetterIndex(index: number): string {
	let result = '';
	for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
		result = String.fromCharCode(65 + (value - 1) % 26) + result;
	}
	return result;
}
