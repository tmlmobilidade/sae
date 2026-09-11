/* * */

import { isBrowser } from './is-browser.js';

/**
 * Converts the input file data into an ArrayBuffer or Uint8Array suitable for JSZip.
 * @param content A File (browser) or Buffer/Uint8Array (Node.js)
 * @deprecated I don't think this is needed anymore.
 */
export async function normalizeFileContent(content: Buffer | File | Uint8Array): Promise<ArrayBuffer | Uint8Array> {
	if (isBrowser && content instanceof File) {
		return await content.arrayBuffer();
	}

	if (content instanceof Buffer || content instanceof Uint8Array) {
		return content;
	}

	throw new TypeError('Unsupported file content type for zipping.');
}
