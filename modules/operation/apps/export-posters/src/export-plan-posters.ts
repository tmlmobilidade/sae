/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { storageProvider } from '@tmlmobilidade/go-providers-storage';
import { type Attachment } from '@tmlmobilidade/go-types-core';
import { type FileExport, type PlanPostersExportProperties } from '@tmlmobilidade/go-types-downloads';

import { generatePlanPostersZip } from './pipeline.js';

/* * */

export async function exportPlanPostersFile(fileExport: FileExport): Promise<Attachment> {
	if (fileExport.type !== 'plan_posters') {
		throw new Error(`File export type is not plan_posters: ${fileExport.type}.`);
	}

	const properties = fileExport.properties as PlanPostersExportProperties['properties'];

	const planData = await goDb.operation.plans.findById(properties.plan_id);
	if (!planData) {
		throw new Error(`Plan ${properties.plan_id} not found for poster export ${fileExport._id}`);
	}

	if (planData.agency_id !== properties.agency_id) {
		throw new Error(`Plan ${planData._id} does not belong to agency ${properties.agency_id}`);
	}

	if (!planData.operation_file_id) {
		throw new Error(`Plan ${planData._id} has no operation file for poster export`);
	}

	const contentMode = properties.content_mode ?? (properties.stop_ids?.length ? 'stops' : properties.line_ids?.length ? 'lines' : 'all');
	const selectedStopIds = contentMode === 'stops' ? properties.stop_ids ?? [] : [];
	const stopsMode = properties.stops_mode ?? 'include';

	// Line filtering is temporarily disabled while PDF exports use stop filters only.
	// const linesMode = properties.lines_mode ?? (properties.line_ids?.length ? 'include' : 'all');
	// const selectedLineIds = contentMode === 'lines' ? properties.line_ids ?? [] : [];
	// if (contentMode === 'lines' && !selectedLineIds.length) {
	// 	throw new Error(`Poster export ${fileExport._id} requires selected lines for ${linesMode} mode.`);
	// }

	if (contentMode === 'stops' && !selectedStopIds.length) {
		throw new Error(`Poster export ${fileExport._id} requires selected stops for ${stopsMode} mode.`);
	}

	const selectedStops = selectedStopIds.length
		? await goDb.infrastructure.stops.findMany({
			flags: {
				$elemMatch: {
					agency_ids: properties.agency_id,
					stop_id: { $in: selectedStopIds },
				},
			},
			is_deleted: false,
		})
		: [];
	const agencyStopIds = new Set(selectedStops.flatMap(stop => stop.flags
		.filter(flag => flag.agency_ids.includes(properties.agency_id))
		.map(flag => flag.stop_id),
	));
	const missingAgencyStopIds = selectedStopIds.filter(stopId => !agencyStopIds.has(stopId));

	if (missingAgencyStopIds.length) {
		throw new Error(`Stops ${missingAgencyStopIds.join(', ')} do not belong to agency ${properties.agency_id}.`);
	}

	// const selectedLines = selectedLineIds.length
	// 	? await goDb.offer.lines.findMany({ _id: { $in: selectedLineIds } })
	// 	: [];
	// if (selectedLineIds.length && selectedLines.length !== new Set(selectedLineIds).size) {
	// 	throw new Error(`One or more selected lines do not exist for poster export ${fileExport._id}.`);
	// }
	// if (selectedLines.some(line => line.agency_id !== properties.agency_id)) {
	// 	throw new Error(`One or more selected lines do not belong to agency ${properties.agency_id}.`);
	// }
	// const lineCodes = selectedLines.map((line) => {
	// 	const numericCode = Number(line.code);
	// 	if (!Number.isFinite(numericCode)) throw new Error(`Line ${line._id} has a non-numeric GTFS code: ${line.code}.`);
	// 	return String(numericCode);
	// });

	const pdfZip = await generatePlanPostersZip(planData, fileExport._id, {
		canvas_profile: properties.canvas_profile,
		content_mode: contentMode,
		// line_codes: lineCodes,
		// lines_mode: linesMode,
		stop_ids: selectedStopIds,
		stops_mode: stopsMode,
	});

	return storageProvider.upload(pdfZip, {
		created_by: 'system',
		name: fileExport.file_name,
		resource_id: fileExport._id,
		scope: 'exports',
		size: pdfZip.byteLength,
		type: 'application/zip',
		updated_by: 'system',
	});
}
