/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { storageProvider } from '@tmlmobilidade/go-providers-storage';
import { type FileExport } from '@tmlmobilidade/go-types-downloads';

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

		const normalizedFileId = plan.attachments.operation_gtfs_normalized;
		if (!normalizedFileId) throw new Error(`Plan ${plan._id} has no normalized GTFS attachment.`);

		//
		// E. Copy normalized GTFS attachment to exports collection

		// Keep a separate export copy so later normalization does not remove this download.
		const file = await storageProvider.copy(normalizedFileId, 'exports', fileExport._id);
		await goDb.core.exports.updateById(fileExport._id, { file_id: file._id, processing_status: 'complete' });
	} catch (error) {
		//

		await goDb.core.exports.updateById(fileExport._id, { processing_status: 'error' });
		throw error;
	}
}
