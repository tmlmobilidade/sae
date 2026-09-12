/* * */

import { isBrowser } from './is-browser.js';

/**
 * Reads a ZIP file from the local filesystem and returns it as an ArrayBuffer.
 * @param path The file system path to the ZIP file.
 * @returns A Promise that resolves to an ArrayBuffer containing the ZIP file data.
 * @throws If there is an error reading the file or if the function is called in a browser environment.
 * @deprecated Why is this needed? Why not a couple of simple fs calls instead?
 */
export async function readZipFromFile(path: string): Promise<ArrayBuffer> {
	//

	if (isBrowser) {
		throw new Error('readZipFromFile is not supported in the browser');
	}

	//
	// Only require fs/promises in Node.js

	const { readFile } = await (Function('return import("fs/promises")')());

	try {
		const buffer = await readFile(path);
		return buffer.buffer as ArrayBuffer;
	} catch (error) {
		throw new Error(`Failed to read ZIP file: ${(error as Error).message}`, error);
	}
}
