/* eslint-disable @typescript-eslint/no-explicit-any */

/* * */

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { MongoDbWriter } from '@helperkits/writer';

/* * */

interface SyncDocumentsOptions<T> {
	dbWriter: MongoDbWriter
	docParser: (pcgiDoc: any) => T
	flushCallback: (data?: any[]) => Promise<void>
	pcgiCollection: any
	pcgiIdKey: string
	pcgiQuery: any
	slaCollection: any
	slaIdKey: string
	slaQuery: any
}

/* * */

export async function syncDocuments<T>({ dbWriter, docParser, flushCallback, pcgiCollection, pcgiIdKey, pcgiQuery, slaCollection, slaIdKey, slaQuery }: SyncDocumentsOptions<T>) {
	try {
		//

		const globalTimer = new TIMETRACKER();

		//
		// Count how many documents are matched in each database
		// for the given queries. If the document count is the same for both databases,
		// then we assume all documents are synced, and we can skip the rest of the process.

		const countQueryTimer = new TIMETRACKER();

		const pcgiDocCount = await pcgiCollection.countDocuments(pcgiQuery);
		const slaDocCount = await slaCollection.countDocuments(slaQuery);

		if (pcgiDocCount === slaDocCount) {
			LOGGER.success(`MATCH: Found the same number of documents in both databases: ${pcgiDocCount} PCGIDB = ${slaDocCount} SLA (${countQueryTimer.get()})`);
			return;
		}

		LOGGER.info(`MISMATCH: Document count was different for both databases: ${pcgiDocCount} PCGIDB != ${slaDocCount} SLA (${countQueryTimer.get()})`);

		//
		// If the document count was different, then we check which documents are missing.
		// Instead of syncing all documents again, we check only the missing IDs. This is done
		// by getting the distinct IDs from each database and comparing them to find the missing ones.

		const distinctQueryTimer = new TIMETRACKER();

		const pcgiDocIds = await pcgiCollection.distinct(pcgiIdKey, pcgiQuery);
		const pcgiDocIdsUnique = new Set(pcgiDocIds);

		const slaDocIds = await slaCollection.distinct(slaIdKey, slaQuery);
		const slaDocIdsUnique = new Set(slaDocIds);

		const missingDocuments = pcgiDocIds.filter((documentId: string) => !slaDocIdsUnique.has(documentId));
		const extraDocuments = slaDocIds.filter((documentId: string) => !pcgiDocIdsUnique.has(documentId));

		LOGGER.info(`PCGI Total: ${pcgiDocIds.length} | PCGI Unique: ${pcgiDocIdsUnique.size} | SLA Total: ${slaDocIds.length} | SLA Unique: ${slaDocIdsUnique.size} | SLA Missing: ${missingDocuments.length} | SLA Extra: ${extraDocuments.length} (${distinctQueryTimer.get()})`);

		//
		// If all documents are already synced, then we can skip the rest of the process.

		if (missingDocuments.length === 0) {
			LOGGER.success(`Chunk complete. All document IDs matched. (${distinctQueryTimer.get()})`);
		}

		//
		// If there are extra documents in the SLA database, then we remove them.

		if (extraDocuments.length > 0) {
			await slaCollection.deleteMany({ [slaIdKey]: { $in: extraDocuments }, ...slaQuery });
			LOGGER.info(`Removed ${extraDocuments.length} extra documents in SLA. (${distinctQueryTimer.get()})`);
		}

		//
		// If there are missing documents, then we sync them.
		// We query the PCGIDB for the missing documents and write them to the SLA database.

		LOGGER.info(`Found ${missingDocuments.length} missing documents in SLA. (${distinctQueryTimer.get()})`);

		const missingDocumentsStream = pcgiCollection
			.find({ [pcgiIdKey]: { $in: missingDocuments } })
			.stream();

		for await (const pcgiDocument of missingDocumentsStream) {
			const parsedSlaDoc = docParser(pcgiDocument);
			await dbWriter.write(parsedSlaDoc, { filter: { [slaIdKey]: parsedSlaDoc[slaIdKey] }, upsert: true }, () => null, flushCallback);
		}

		//
		// Flush the remaining documents in the writer to the database
		// and complete the sync process.

		await dbWriter.flush(flushCallback);

		LOGGER.success(`Complete! Synced ${missingDocuments.length} new documents. (${globalTimer.get()})`);

		//
	}
	catch (err) {
		console.log('An error occurred. Halting execution.', err);
		console.log('Retrying in 10 seconds...');
		setTimeout(() => {
			process.exit(0); // End process
		}, 10000); // after 10 seconds
	}

	//
};
