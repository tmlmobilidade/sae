/* * */

import { PostersController } from '@/controller/poster.js';
import { importPlanToSqlite } from '@/import-plan-to-sqlite.js';
import { type ExportToHitouchConfig } from '@/types.js';
import { FileExportDownloadUrlSchema, type PlanPostersContentMode, type PlanPostersFilterMode } from '@tmlmobilidade/go-types-downloads';
import { type LinesMode } from '@tmlmobilidade/go-types-offer';
import { type Plan } from '@tmlmobilidade/go-types-operation';
import { Logger } from '@tmlmobilidade/logger';
import fs from 'node:fs';
import path from 'node:path';

/* * */

const PDF_STATUS_POLL_INTERVAL_MS = 60_000;

/* * */

function waitForNextStatusCheck(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, PDF_STATUS_POLL_INTERVAL_MS));
}

/* * */

export async function generatePlanPostersDownloadUrl(planData: Plan, exportId: string, options?: { canvas_profile?: ExportToHitouchConfig['canvas_profile'], content_mode?: PlanPostersContentMode, line_codes?: string[], lines_mode?: LinesMode, stop_ids?: string[], stops_mode?: PlanPostersFilterMode }): Promise<string> {
	const postersController = new PostersController();
	let exportConfig: ExportToHitouchConfig | undefined;

	try {
		Logger.info({ message: `Preparing GTFS files for poster export ${exportId} (Plan ${planData._id}).` });
		exportConfig = await importPlanToSqlite(planData, { ...options, workdir: `/tmp/hitouch/export-${exportId}` });

		const requestZipPath = path.resolve(exportConfig.workdir, exportConfig.output);
		const preservedRequestZipPath = `/tmp/hitouch/export-${exportId}-request.zip`;
		fs.copyFileSync(requestZipPath, preservedRequestZipPath);
		Logger.info({ message: `Preserved HiTouch request ZIP at ${preservedRequestZipPath}.` });

		await postersController.generateToken();

		Logger.info({ message: `Submitting poster GTFS for export ${exportId} to ZPHERES.` });
		const pdfId = await postersController.generatePDF(exportConfig);
		Logger.info({ message: `Created ZPHERES PDF job ${pdfId} for poster export ${exportId}.` });

		let pdfStatus = await postersController.getPDFStatus(pdfId);

		while (pdfStatus.status !== 'done') {
			if (pdfStatus.status === 'error' || pdfStatus.status === 'failed') {
				throw new Error(`PDF job ${pdfId} failed.`);
			}

			Logger.info({ message: `ZPHERES PDF job ${pdfId} is ${pdfStatus.status}; checking again in 60 seconds.` });
			await waitForNextStatusCheck();
			pdfStatus = await postersController.getPDFStatus(pdfId);
		}

		if (!pdfStatus.downloadLink) {
			throw new Error(`PDF job ${pdfId} completed without a download URL.`);
		}

		const downloadUrl = FileExportDownloadUrlSchema.parse(pdfStatus.downloadLink);
		Logger.info({ message: `Poster export ${exportId} is ready for download from ZPHERES.` });
		return downloadUrl;
	} finally {
		if (exportConfig) {
			fs.rmSync(exportConfig.workdir, { force: true, recursive: true });
			Logger.info({ message: `Cleaned temporary files for poster export ${exportId}.` });
		}
	}
}
