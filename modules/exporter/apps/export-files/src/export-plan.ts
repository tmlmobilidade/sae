/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { type FileExport } from '@tmlmobilidade/go-types-downloads';
import { Logger } from '@tmlmobilidade/logger';

/* * */

export async function exportPlanFile(fileExport: Extract<FileExport, { type: 'plan' }>): Promise<void> {
	//

	try {
		//
		// A. Update export status

		await goDb.core.exports.updateById(fileExport._id, { processing_status: 'processing' });

		//
		// B. Get plan

		const plan = await goDb.operation.plans.findById(fileExport.properties.plan_id);

		if (!plan) throw new Error(`Plan ${fileExport.properties.plan_id} not found.`);

		//
		// C. Check if plan belongs to agency

		if (plan.agency_id !== fileExport.properties.agency_id) {
			throw new Error(`Plan ${plan._id} does not belong to agency ${fileExport.properties.agency_id}.`);
		}

		//
		// D. Get normalized GTFS attachment

		const sourceFileId = plan.attachments?.operation_gtfs_normalized;
		if (!sourceFileId) throw new Error(`Plan ${plan._id} has no normalized GTFS attachment.`);

		const file = await goDb.core.attachments.findById(sourceFileId);
		if (!file) throw new Error(`Normalized GTFS attachment ${sourceFileId} for plan ${plan._id} not found.`);

		//
		// E. Export the existing normalized GTFS attachment

		await goDb.core.exports.updateById(fileExport._id, { file_id: file._id, processing_status: 'complete' });
		Logger.success(`Plan GTFS export ${fileExport._id} completed.`);
	} catch (error) {
		//

		await goDb.core.exports.updateById(fileExport._id, { processing_status: 'error' });
		throw error;
	}
}
