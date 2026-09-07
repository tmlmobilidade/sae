/* * */

import { type ExportToHitouchConfig } from '@/types.js';
import fs from 'node:fs';
import path from 'node:path';
import { ZipFile } from 'yazl';

/* * */

const UNSUPPORTED_HITOUCH_FILES = new Set(['feed_info.txt']);

/* * */

/**
 * Creates the HiTouch ZIP archive with all supported TXT files at the archive root.
 */
export async function createHitouchZip(exportConfig: ExportToHitouchConfig): Promise<string> {
	//

	const outputPath = path.resolve(exportConfig.workdir, exportConfig.output);
	const temporaryOutputPath = `${outputPath}.tmp`;

	const textFiles = fs.readdirSync(exportConfig.workdir, { withFileTypes: true })
		.filter((entry) => {
			const isSupported = !UNSUPPORTED_HITOUCH_FILES.has(entry.name.toLowerCase());
			const isTextFile = path.extname(entry.name).toLowerCase() === '.txt';

			return entry.isFile() && isTextFile && isSupported;
		})
		.map(entry => entry.name)
		.sort();

	if (!textFiles.length) {
		throw new Error(`No TXT files found in ${exportConfig.workdir}.`);
	}

	const emptyTextFiles = textFiles.filter(fileName => fs.statSync(path.join(exportConfig.workdir, fileName)).size === 0);

	if (emptyTextFiles.length) {
		throw new Error(`Empty TXT files found in ${exportConfig.workdir}: ${emptyTextFiles.join(', ')}.`);
	}

	if (fs.existsSync(temporaryOutputPath)) {
		fs.rmSync(temporaryOutputPath);
	}

	const outputZip = new ZipFile();

	for (const fileName of textFiles) {
		outputZip.addFile(path.join(exportConfig.workdir, fileName), fileName);
	}

	await new Promise<void>((resolve, reject) => {
		const outputStream = fs.createWriteStream(temporaryOutputPath);

		outputStream.on('close', resolve);
		outputStream.on('error', reject);
		outputZip.outputStream.on('error', reject);
		outputZip.outputStream.pipe(outputStream);
		outputZip.end();
	});

	const zipSize = fs.statSync(temporaryOutputPath).size;

	if (zipSize === 0) {
		fs.rmSync(temporaryOutputPath);
		throw new Error(`Created ZIP file is empty: ${temporaryOutputPath}.`);
	}

	fs.renameSync(temporaryOutputPath, outputPath);

	return outputPath;
}
