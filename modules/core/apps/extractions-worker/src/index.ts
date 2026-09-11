/* * */

import { type ExtractionsCoordinatorResponse } from '@tmlmobilidade/go-core-pckg-types';
import { getExtractionsCoordinatorUrl } from '@tmlmobilidade/go-core-pckg-utils';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { runOnInterval, startHeartbeat } from '@tmlmobilidade/go-utils-exec';
import { initSentryNode, Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';
import { ZipFile } from 'yazl';

import { VERSIONS_MAP } from './versions.js';

/* * */

//
// Initialize Sentry

try {
	await initSentryNode();
	Logger.startNodeLogs({ app: 'rides-feeder', message: 'Sentry Rides Feeder initialized', module: 'controller', severity: 'info' });
} catch (error) {
	Logger.error({ error, message: 'Error initializing Sentry Rides Feeder' });
}

async function main() {
	//

	Logger.init();

	const globalTimer = new Timer();

	//
	// Ask the coordinator for a new Plan ID to process

	const fetchCoordinatorTimer = new Timer();

	const extractionId = await fetch(getExtractionsCoordinatorUrl('extractions'))
		.then(response => response.json())
		.then(data => data as ExtractionsCoordinatorResponse)
		.then(data => data.extraction_id);

	if (!extractionId) {
		console.log(`No extraction to process. Skipping run. (fetch: ${fetchCoordinatorTimer.get()})`);
		return;
	}

	console.log(`Received extraction ID from coordinator: ${extractionId} (fetch: ${fetchCoordinatorTimer.get()})`);

	//
	// Retrieve the extraction from the database

	const currentExtraction = await goDb.core.extractions.findById(extractionId);

	if (!currentExtraction) {
		Logger.error({ message: `Extraction not found: ${extractionId}` });
		return;
	}

	//
	// Run the extraction job.
	// Set a heartbeat to keep the job alive.

	const heartbeat = startHeartbeat({
		intervalMs: 30_000,
		runFn: async () => {
			await goDb.core.extractions.updateById(extractionId, { processing_status: 'processing' });
		},
	});

	try {
		//

		//
		// From the extraction version, run the appropriate task.

		const taskRunner = VERSIONS_MAP[currentExtraction.version];
		if (!taskRunner) throw new Error(`No task runner found for version: ${currentExtraction.version}`);

		const result = await taskRunner(currentExtraction.properties);

		heartbeat.stop();

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
	} catch (error) {
		heartbeat.stop();
		await goDb.core.extractions.updateById(extractionId, { processing_status: 'error' });
		Logger.error({ error, message: `Error processing extraction ${extractionId}` });
		Logger.divider();
	}

	Logger.terminate(`Run took ${globalTimer.get()}`);
};

/* * */

await runOnInterval(main, { intervalMs: '10s' });
