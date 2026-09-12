/* * */

import { setDirectoryPermissions } from '@tmlmobilidade/go-utils-fs';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import yauzl from 'yauzl';

/**
 * Unzips a zip file into a directory using Yauzl.
 * @param zipFilePath The path to the zip file to unzip.
 * @param outputDir The path to the directory to unzip the file to.
 * @param dirPermissionsMode The mode to set the permissions of the unzipped directory to.
 * Defaults to `0o666` (read and write for owner, group and others).
 * @returns A promise that resolves when the file is unzipped.
 */
export async function unzipFile(zipFilePath: string, outputDir: string, dirPermissionsMode: fs.Mode = 0o666) {
	//

	//
	// Create the output directory if it doesn't exist

	if (fs.existsSync(outputDir)) throw new Error(`Output directory ${outputDir} already exists`);

	fs.mkdirSync(outputDir, { recursive: true });

	//
	// Open the zip file

	const zipfile = await yauzl.openPromise(zipFilePath);

	//
	// Iterate over each entry in the zip file

	for await (const entry of zipfile.eachEntry()) {
		//

		//
		// Directory file names end with '/'.
		// Note that entries for directories themselves are optional.
		// An entry's fileName implicitly requires its parent directories to exist.

		if (entry.fileName.endsWith('/')) continue;

		//
		// file entry

		const readStream = await zipfile.openReadStreamPromise(entry);

		const filePath = path.join(outputDir, entry.fileName);

		await pipeline(readStream, fs.createWriteStream(filePath));
	}

	//
	// Set the permissions of the output directory

	setDirectoryPermissions(outputDir, dirPermissionsMode);
}
