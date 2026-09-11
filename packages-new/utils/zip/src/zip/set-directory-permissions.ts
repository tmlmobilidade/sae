/* * */

import fs from 'node:fs';

/**
 * Sets the permissions of a directory and its files.
 * @param dirPath The path to the directory to set the permissions of.
 * @param mode The mode to set the permissions of the directory and its files to.
 */
export function setDirectoryPermissions(dirPath: string, mode: number) {
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
