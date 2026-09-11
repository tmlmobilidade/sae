/* * */

import { generateRandomString } from '@tmlmobilidade/strings';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { isBrowser } from './is-browser.js';

/**
 * Gets the temporary working directory path for a given ID.
 * @param id The ID to get the temporary working directory path for.
 * @returns The temporary working directory path.
 * @deprecated Use `fs.mkdtempDisposableSync('prefix-to-my-function-')` instead to get
 * a safe, native temporary directory path.
 */
export function getTmpWorkdirPath(id?: string, createIfNotExists?: boolean): string {
	//

	if (isBrowser) {
		throw new Error('getTmpWorkdirPath is not supported in the browser');
	}

	//
	// Use the system temporary directory and create
	// a subdirectory based on the ID, if any was provided.
	// Otherwise, use a random ID for the subdirectory.

	const osTmpDir = tmpdir();

	const workdirName = id ? id : generateRandomString();

	const workdirPath = join(osTmpDir, encodeURIComponent(workdirName));

	//
	// If the createIfNotExists flag is set to true,
	// create the directory if it doesn't exist.

	if (createIfNotExists && !fs.existsSync(workdirPath)) {
		fs.mkdirSync(workdirPath, { recursive: true });
	}

	//
	// Return the temporary working directory path.

	return workdirPath;
}
