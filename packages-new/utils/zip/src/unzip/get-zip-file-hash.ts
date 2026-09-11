/* * */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import unzipper from 'unzipper';

import { getDirectoryFiles } from './get-directory-files.js';

/**
 * Calculates a deterministic SHA-256 hash of the contents of a `.zip` file.
 * The hash is independent of `.zip` file metadata such as file modification timestamps,
 * compression settings, and `.zip` file entry ordering.
 * Files are hashed individually in streaming mode, then the filenames and
 * individual hashes are sorted and combined into the final hash.
 * @param filePath The path to the `.zip` file.
 * @returns The SHA-256 hash of the `.zip` file contents.
 */
export async function getZipFileHash(filePath: string): Promise<string> {
	//

	//
	// Initialize a new temporary directory

	const temporaryDirectory = fs.mkdtempDisposableSync('get-zip-file-hash-');

	try {
		//

		//
		// Extract the ZIP file into the temporary directory.

		await fs
			.createReadStream(filePath)
			.pipe(unzipper.Extract({ path: temporaryDirectory.path }))
			.promise();

		//
		// Find all extracted files.

		const sortedExtractedFilePaths = await getDirectoryFiles(temporaryDirectory.path);

		//
		// Initialize the list of files to hash.

		const foundFiles: { hash: string, path: string }[] = [];

		for (const absolutePath of sortedExtractedFilePaths) {
		// Create a new hash for the file
			const hash = createHash('sha256');
			// Open a read stream for the file.
			const stream = fs.createReadStream(absolutePath);
			// Stream the file contents and calculate the SHA-256 hash.
			for await (const chunk of stream) {
				hash.update(chunk);
			}
			// Add the file to the list of files to hash.
			const relativeFilePath = path.relative(temporaryDirectory.path, absolutePath);
			foundFiles.push({ hash: hash.digest('hex'), path: relativeFilePath });
		}

		//
		// Make the result independent of the order of entries in the zip file.

		foundFiles.sort((a, b) => a.path.localeCompare(b.path));

		//
		// Clean up the temporary directory.

		temporaryDirectory.remove();

		//
		// Calculate the final hash by concatenating the sorted list
		// of filenames and individual file hashes.

		const finalHash = createHash('sha256');

		for (const file of foundFiles) {
			finalHash.update(file.path);
			finalHash.update('\0');
			finalHash.update(file.hash);
			finalHash.update('\0');
		}

		return finalHash.digest('hex');

		//
	} finally {
		temporaryDirectory.remove();
	}
}
