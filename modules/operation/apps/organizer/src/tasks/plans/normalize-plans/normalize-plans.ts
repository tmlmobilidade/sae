/* * */

import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { getPlanHash, setPlanStatus } from '@tmlmobilidade/go-operation-pckg-utils';
import { storageProvider } from '@tmlmobilidade/go-providers-storage';
import { unzipFile } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';
import fs from 'node:fs';
import path from 'node:path';
import { ZipFile } from 'yazl';

import { initNormalizePlansTaskContext } from './context/init-context.js';
import { updateAgencyTxtContents } from './steps/agency.js';
import { updateFeedInfoTxtContents } from './steps/feed-info.js';
import { rewriteShapeIdsToPatternIds } from './steps/shapes.js';

/**
 * This task makes sure the associated GTFS files of plan documents have the correct
 * agency.txt and feed_info.txt information, and that the shape_id values of trips.txt
 * and shapes.txt match the pattern_id of each trip.
 * This will download the zip archive, unzip it, check and update the necessary files,
 * re-zip it and upload it again, for each plan document.
 */
export async function normalizePlansTask() {
	//

	Logger.init();

	const globalTimer = new Timer();

	//
	// Fetch all plans from the database

	const allPlans = await goDb.operation.plans.findMany(
		{ $expr: { $ne: ['$hash', '$apps.organizer.last_hash'] } },
		{ sort: { active_from: -1 } },
	);

	Logger.info({ message: `Found ${allPlans.length} plans to normalize.` });

	//
	// Normalize each plan

	for (const [index, planData] of allPlans.entries()) {
		//

		Logger.info({ message: `[${allPlans.length - index}/${allPlans.length}] Processing plan ${planData._id}` });

		await setPlanStatus(planData._id, 'organizer', 'processing');

		//
		// Initialize the context

		const context = await initNormalizePlansTaskContext(planData);

		try {
			//

			//
			// Download the operation file from storage

			const operationGtfsAttachmentData = await storageProvider.findById(planData.attachments.operation_gtfs);

			if (!operationGtfsAttachmentData?.url) {
				throw new Error(`[${planData._id}] Operation GTFS attachment "${planData.attachments.operation_gtfs}" not found.`);
			}

			Logger.info({ message: `Downloading GTFS file from URL: ${operationGtfsAttachmentData.url}` });
			const downloadResponse = await fetch(operationGtfsAttachmentData.url);
			const downloadArrayBuffer = await downloadResponse.arrayBuffer();
			fs.writeFileSync(context.paths.operation_gtfs_file_path, Buffer.from(downloadArrayBuffer));
			Logger.success(`Downloaded GTFS file from URL: ${operationGtfsAttachmentData.url}`);

			//
			// Unzip the GTFS file.

			Logger.info({ message: 'Unzipping GTFS file...' });
			await unzipFile(context.paths.operation_gtfs_file_path, context.paths.extracted_dir_path);
			Logger.success(`Unzipped GTFS file from "${context.paths.operation_gtfs_file_path}" to "${context.paths.extracted_dir_path}".`, 1);

			//
			// Update the agency.txt and feed_info.txt files
			// in the extracted directory with normalized data.

			updateAgencyTxtContents(context);

			updateFeedInfoTxtContents(context);

			//
			// Align the shape_id values of trips.txt and shapes.txt with the pattern_id
			// of each trip. Both files are streamed through a temporary working directory,
			// which the zip archive reads from while it is being generated below.

			await rewriteShapeIdsToPatternIds(context);

			Logger.info({ message: `[${planData._id}] trips.txt and shapes.txt shape_id values aligned with pattern_id.` });

			//
			// Zip the exported GTFS files into a single archive.
			// YAZL is used here for its focus on performance and low memory usage.

			const zipTimer = new Timer();

			Logger.info({ message: 'Zipping new GTFS archive...' });

			const outputZip = new ZipFile();

			await new Promise<void>((resolve, reject) => {
				try {
					// Read the working directory contents
					const workdirDirContents = fs.readdirSync(context.paths.extracted_dir_path, { withFileTypes: true });
					// Add each file to the zip
					for (const outputDirFile of workdirDirContents) {
						if (!outputDirFile.isFile()) continue;
						const filePath = path.join(context.paths.extracted_dir_path, outputDirFile.name);
						outputZip.addFile(filePath, outputDirFile.name);
					}
					// Setup a write stream to the final zip file
					outputZip.outputStream
						.pipe(fs.createWriteStream(context.paths.operation_gtfs_normalized_file_path))
						.on('close', resolve);
					// Finalize the zip creation, which triggers
					// the piping and writing process.
					outputZip.end();
				} catch (error) {
					reject(error);
				}
			});

			Logger.success(`Zipped new GTFS archive in ${zipTimer.get()}.`);

			//
			// Upload the new GTFS archive to the storage provider.

			const updatedOperationGtfsNormalizedBuffer = fs.readFileSync(context.paths.operation_gtfs_normalized_file_path);

			const updatedFileResult = await storageProvider.upload(
				updatedOperationGtfsNormalizedBuffer,
				{
					created_by: 'system',
					name: `plan-${planData._id}-normalized.zip`,
					resource_id: planData._id,
					scope: 'plans',
					size: updatedOperationGtfsNormalizedBuffer.byteLength,
					type: 'application/zip',
					updated_by: 'system',
				},
				{
					onSuccess: async (_, result, session) => {
						const plansCollection = await goDb.operation.plans.getCollection();
						await plansCollection.updateOne(
							{ _id: planData._id },
							{ $set: { 'attachments.operation_gtfs_normalized': result._id } },
							{ session },
						);
					},
				},
			);

			//
			// Delete previous operation GTFS normalized attachment if it exists

			if (planData.attachments.operation_gtfs_normalized) {
				const foundPrevAttachmentData = await storageProvider.findById(planData.attachments.operation_gtfs_normalized);
				if (foundPrevAttachmentData) await storageProvider.delete(foundPrevAttachmentData._id);
			}

			Logger.info({ message: `[${planData._id}] Operation GTFS normalized updated: ${updatedFileResult.size}` });

			//
			// Update the last hash of the organizer app for this plan.

			//
			// Get a new hash for this plan

			const newHashValue = await getPlanHash({
				activeFrom: planData.active_from,
				activeUntil: planData.active_until,
				operationGtfsAttachmentId: planData.attachments.operation_gtfs,
				operationGtfsNormalizedAttachmentId: updatedFileResult._id,
				planId: planData._id,
			});

			await goDb.operation.plans.updateById(planData._id, { hash: newHashValue });

			await setPlanStatus(planData._id, 'organizer', 'complete', newHashValue);

			Logger.success(`Updated last hash of organizer app for plan ${planData._id}.`, 1);

			//
		} catch (error) {
			Logger.error({ error, message: `Error processing plan ${planData._id}:` });
			await setPlanStatus(planData._id, 'organizer', 'error');
		} finally {
			// Cleanup the working directory
			context.paths.removeDir();
			Logger.success(`Cleaned up working directory.`, 1);
		}
	}

	Logger.terminate(`Normalization completed in ${globalTimer.get()}`);
}
