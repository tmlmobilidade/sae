/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type FileExport, type FlatSamsAnalysisExportAnalysis, type SamsAnalysisExportProperties } from '@tmlmobilidade/go-types-downloads';
import { buildSamsMatch, sams, samsAnalysisExportAggregationPipeline } from '@tmlmobilidade/interfaces';
import { Logger } from '@tmlmobilidade/logger';
import { generateRandomString } from '@tmlmobilidade/strings';
import { Timer } from '@tmlmobilidade/timer';
import { PermissionCatalog, type Sam, type SamAnalysis } from '@tmlmobilidade/types';
import { CsvWriter } from '@tmlmobilidade/writers';
import os from 'os';
import path from 'path';

import { parseAnalysis } from './lib/parse-analysis.js';

/* * */

/**
 * Exports SAM analysis records to a CSV file.
 * One row per `analysis` entry of the matching SAM documents.
 *
 * @param fileExport - The file export object.
 * @returns The path to the exported file.
 */
export async function exportSamsAnalysisFile(fileExport: FileExport): Promise<string> {
	//

	if (fileExport.type !== 'sams_analysis') throw new Error(`File export type is not sams_analysis: ${fileExport.type}.`);

	if (!fileExport.properties) throw new Error(`File export properties is missing.`);

	//
	// Setup a timer to track the execution time
	const timer = new Timer();

	await goDb.core.exports.updateById(fileExport._id, { processing_status: 'processing' });

	//
	// Build the pipeline from stored properties.
	const properties = fileExport.properties as SamsAnalysisExportProperties['properties'];
	// Backward compatible: accept both legacy `_id` and current `sam_ids`.
	const samIds = properties.sam_ids ?? properties._id ?? undefined;
	const query = {
		agency_ids: properties.agency_ids ?? [PermissionCatalog.ALLOW_ALL_FLAG],
		latest_apex_version: properties.apex_versions ?? undefined,
		search: properties.search ?? undefined,
		seen_first_at: properties.seen_first_at ?? undefined,
		seen_last_at: properties.seen_last_at ?? undefined,
		system_status: properties.statuses ?? undefined,
	};
	const matchAnd = buildSamsMatch(query as Parameters<typeof buildSamsMatch>[0]);
	const analysisFilter = {
		end_time: properties.end_time ?? undefined,
		start_time: properties.start_time ?? undefined,
	};

	if ((!samIds || samIds.length === 0) && matchAnd.length === 0) {
		throw new Error('SAMS analysis export requires either `sam_ids` or list filters.');
	}

	const pipeline = samsAnalysisExportAggregationPipeline({
		analysisFilter,
		matchAnd: matchAnd.length > 0 ? matchAnd : undefined,
		samIds,
	});

	//
	// Stream matching analysis rows
	const samsCollection = await sams.getCollection();
	const analysisCursor = samsCollection.aggregate(pipeline, { cursor: { batchSize: 5000 } });

	//
	// Write the analysis rows to the file
	const tempFilePath = path.join(os.tmpdir(), `${fileExport.file_name}_${generateRandomString()}.csv`);
	const csvWriter = new CsvWriter<FlatSamsAnalysisExportAnalysis>(fileExport.file_name, tempFilePath, { batch_size: 10000, include_bom: true });

	let count = 0;
	for await (const row of analysisCursor) {
		const parsedRow = row as Partial<Sam> & { _id?: number, agency_id?: string, analysis?: SamAnalysis, sam_id?: number };
		if (!parsedRow.analysis) continue;
		await csvWriter.write(parseAnalysis({
			_id: parsedRow.sam_id ?? parsedRow._id,
			agency_id: parsedRow.agency_id,
			analysis: parsedRow.analysis,
		}));
		count++;
	}

	await csvWriter.flush();

	Logger.success(`Exported ${count} SAM analysis rows in ${timer.get()}`, 1);
	Logger.info({ message: `File path: ${tempFilePath}` });
	Logger.spacer(1);

	return tempFilePath;
}
