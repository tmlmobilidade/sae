/* * */

import { storageProvider } from '@tmlmobilidade/go-providers-storage';
import { type Attachment } from '@tmlmobilidade/go-types-core';
import { type HashablePlanMetadata } from '@tmlmobilidade/go-types-operation';
import { type OperationalDateInt } from '@tmlmobilidade/go-types-shared';
import { getZipFileHash } from '@tmlmobilidade/go-utils-exec';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/* * */

interface GetPlanHashParams {
	activeFrom: OperationalDateInt
	activeUntil: OperationalDateInt
	operationGtfsAttachmentId: string
	operationGtfsNormalizedAttachmentId?: null | string
	planId: string
}

/**
 * Get the hash of a plan
 * @param params - The parameters for the function
 * @returns The hash of the plan
 */
export async function getPlanHash({ activeFrom, activeUntil, operationGtfsAttachmentId, operationGtfsNormalizedAttachmentId, planId }: GetPlanHashParams): Promise<string> {
	//

	console.info(`[getPlanHash()] Getting hash for plan ${planId}: activeFrom=${activeFrom}, activeUntil=${activeUntil}, operationGtfsAttachmentId=${operationGtfsAttachmentId}, operationGtfsNormalizedAttachmentId=${operationGtfsNormalizedAttachmentId}`);

	//
	// Check if all necessary data is present

	if (!activeFrom) throw new Error(`[getPlanHash()] No active_from date received for plan ${planId}`);

	if (!activeUntil) throw new Error(`[getPlanHash()] No active_until date received for plan ${planId}`);

	if (!operationGtfsAttachmentId) throw new Error(`[getPlanHash()] No Operation GTFS attachment ID received for plan ${planId}`);

	//
	// Retrieve the Operation GTFS attachment from the storage provider

	const operationGtfsAttachmentData = await storageProvider.findById(operationGtfsAttachmentId);

	if (!operationGtfsAttachmentData?.url) {
		throw new Error(`[getPlanHash()] Operation GTFS attachment "${operationGtfsAttachmentId}" not found in Storage for plan ${planId}`);
	}

	//
	// If available, retrieve the Operation GTFS normalized attachment from the storage provider

	let operationGtfsNormalizedAttachmentData: Attachment | null = null;

	if (operationGtfsNormalizedAttachmentId) {
		operationGtfsNormalizedAttachmentData = await storageProvider.findById(operationGtfsNormalizedAttachmentId);
	}

	if (!operationGtfsNormalizedAttachmentData?.url) {
		console.error(`[getPlanHash()] Operation GTFS normalized attachment "${operationGtfsNormalizedAttachmentId}" not found in Storage for plan ${planId}`);
	}

	//
	// Initialize a new temporary directory

	const temporaryDirectory = fs.mkdtempDisposableSync('get-plan-hash-');

	try {
		//
		// Download the operation GTFS file from the storage provider
		// and calculate the hash of the operation GTFS file.

		const downloadResponse = await fetch(operationGtfsAttachmentData.url);
		const downloadArrayBuffer = await downloadResponse.arrayBuffer();
		const downloadFilePath = path.join(temporaryDirectory.path, 'gtfs.zip');

		fs.writeFileSync(downloadFilePath, Buffer.from(downloadArrayBuffer));

		const operationGtfsAttachmentHash = await getZipFileHash(downloadFilePath);

		//
		// Download the normalized operation GTFS file from the storage provider
		// and calculate the hash of the normalized operation GTFS file.

		let operationGtfsNormalizedAttachmentHash: null | string = null;

		if (operationGtfsNormalizedAttachmentData?.url) {
			const downloadNormalizedResponse = await fetch(operationGtfsNormalizedAttachmentData.url);
			const downloadNormalizedArrayBuffer = await downloadNormalizedResponse.arrayBuffer();
			const downloadNormalizedFilePath = path.join(temporaryDirectory.path, 'gtfs-normalized.zip');
			fs.writeFileSync(downloadNormalizedFilePath, Buffer.from(downloadNormalizedArrayBuffer));
			operationGtfsNormalizedAttachmentHash = await getZipFileHash(downloadNormalizedFilePath);
		}

		//
		// Create a hashable plan metadata object

		const hashablePlanMetadata: HashablePlanMetadata = {
			_id: planId,
			active_from: activeFrom,
			active_until: activeUntil,
			operation_gtfs_hash: operationGtfsAttachmentHash,
			operation_gtfs_normalized_hash: operationGtfsNormalizedAttachmentHash,
		};

		//
		// Create a SHA-256 hash of the hashable plan metadata object and return it

		const hashValue = createHash('sha256')
			.update(JSON.stringify(hashablePlanMetadata))
			.digest('hex');

		return hashValue;

		//
	} finally {
		temporaryDirectory.remove();
	}
}
