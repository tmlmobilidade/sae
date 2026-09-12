/* * */

import fs from 'node:fs';

/**
 * Sets the permissions of a directory and all its files using `chmod` recursively.
 * @param dirPath The path to the directory to set the permissions of.
 * @param mode The mode to set the permissions of the directory and all its files to.
 */
export function setDirectoryPermissions(dirPath: string, mode: fs.Mode) {
	const files = fs.readdirSync(dirPath, { withFileTypes: true });
	for (const file of files) {
		const filePath = `${dirPath}/${file.name}`;
		if (file.isDirectory()) {
			setDirectoryPermissions(filePath, mode);
		} else {
			fs.chmodSync(filePath, mode);
		}
	}
}
