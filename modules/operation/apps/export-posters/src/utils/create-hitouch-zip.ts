/* * */

import { type ExportToHitouchConfig } from '@/types.js';
import { Logger } from '@tmlmobilidade/logger';
import fs from 'node:fs';
import path from 'node:path';
import { ZipFile } from 'yazl';

/* * */

const UNSUPPORTED_HITOUCH_FILES = new Set(['feed_info.txt']);
const ZIP_TIMEOUT_MS = 2 * 60_000;

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

	Logger.info({ message: `Zipping ${textFiles.length} HiTouch files from ${exportConfig.workdir}...` });

	if (fs.existsSync(temporaryOutputPath)) {
		fs.rmSync(temporaryOutputPath);
	}

	const outputZip = new ZipFile();

	for (const fileName of textFiles) {
		outputZip.addFile(path.join(exportConfig.workdir, fileName), fileName);
	}

	await new Promise<void>((resolve, reject) => {
		let settled = false;
		const outputStream = fs.createWriteStream(temporaryOutputPath);
		const timeout = setTimeout(() => {
			fail(new Error(`Timed out creating ZIP after ${ZIP_TIMEOUT_MS / 1000}s: ${temporaryOutputPath}`));
		}, ZIP_TIMEOUT_MS);

		const succeed = () => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			resolve();
		};

		const fail = (error: Error) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			outputStream.destroy();
			reject(error);
		};

		outputStream.on('finish', succeed);
		outputStream.on('error', fail);
		outputZip.on('error', fail);
		outputZip.outputStream.on('error', fail);
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
