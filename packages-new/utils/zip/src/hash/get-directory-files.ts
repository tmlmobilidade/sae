/* * */

import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Gets the files in a directory and its subdirectories recursively.
 * @param dirPath The path to the directory to get the files from.
 * @returns A promise that resolves to an array of file paths.
 */
export async function getDirectoryFiles(dirPath: string): Promise<string[]> {
	//

	//
	// Read the directory contents.

	const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });

	//
	// Initialize the list of files.

	const dirFiles: string[] = [];

	for (const entry of dirEntries) {
		// Get the path to the entry.
		const entryPath = path.join(dirPath, entry.name);
		// If the entry is a directory, recursively get
		// the files in the subdirectory.
		if (entry.isDirectory()) {
			const subdirFiles = await getDirectoryFiles(entryPath);
			dirFiles.push(...subdirFiles);
			continue;
		}
		// Add the path to the list of files.
		if (entry.isFile()) {
			dirFiles.push(entryPath);
		}
	}

	//
	// Sort and return the list of files in the directory
	// and its subdirectories.

	const sortedDirFiles = dirFiles.sort((a, b) => a.localeCompare(b));

	return sortedDirFiles;
}
