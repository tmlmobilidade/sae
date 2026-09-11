/* * */

import { setDirectoryPermissions } from '@tmlmobilidade/go-utils-fs';
import fs from 'node:fs';
import unzipper from 'unzipper';

/**
 * Unzips a zip file into a directory in stream mode, avoiding memory issues.
 * This also calls the `setDirectoryPermissions` function to override
 * the permissions of the unzipped files, if any were preserved in the zip file.
 * @param zipFilePath The path to the zip file to unzip.
 * @param outputDir The path to the directory to unzip the file to.
 * @param dirPermissionsMode The mode to set the permissions of the unzipped directory to.
 * Defaults to `0o666` (read and write for owner, group and others).
 * @returns A promise that resolves when the file is unzipped.
 */
export async function zipDirectory(zipFilePath: string, outputDir: string, dirPermissionsMode = 0o666) {
	await fs
		.createReadStream(zipFilePath)
		.pipe(unzipper.Extract({ path: outputDir }))
		.promise();
	setDirectoryPermissions(outputDir, dirPermissionsMode);
}
