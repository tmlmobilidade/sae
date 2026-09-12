/* * */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Returns a list of all the files inside a directory and its subdirectories recursively.
 * @param dirPath The path to the directory to get the files from.
 * @returns A list of all the files inside the directory and its subdirectories recursively.
 */
export function getDirectoryFiles(dirPath: string): string[] {
	//

	//
	// Read the directory contents.

	const dirEntries = fs.readdirSync(dirPath, { withFileTypes: true });

	//
	// Initialize the list of files.

	const dirFiles: string[] = [];

	for (const entry of dirEntries) {
		// Get the path to the entry.
		const entryPath = path.join(dirPath, entry.name);
		// If the entry is a directory, recursively get
		// the files in the subdirectory.
		if (entry.isDirectory()) {
			const subdirFiles = getDirectoryFiles(entryPath);
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
