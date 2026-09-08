/* * */

import { setRidesAsWaiting } from '@tmlmobilidade/go-apex-pckg-callback';
import { parseRawApexTransactionBankingTapV40IntoSimplifiedApexBankingTap } from '@tmlmobilidade/go-apex-pckg-parsers';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { rawDb } from '@tmlmobilidade/go-interfaces-rawdb';
import { type RawApexTransaction, SimplifiedApexBankingTap } from '@tmlmobilidade/go-types-apex';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { BatchWriter } from '@tmlmobilidade/go-utils-exec';
import { performInChunks, type PerformInTimeChunksItem, replicate } from '@tmlmobilidade/go-utils-exec';
import { Logger } from '@tmlmobilidade/logger';
import { type Filter } from 'mongodb';
import { ZodError } from 'zod';

/* * */

const writer = new BatchWriter<SimplifiedApexBankingTap>({
	batch_size: 10_000,
	insertFn: async (data) => {
		await labDb.simplifiedApex.bankingTaps.insert('JSONEachRow', data);
	},
	title: await labDb.simplifiedApex.bankingTaps.getTableName(),
});

/**
 * Syncs APEX Banking Taps from the PCGI database
 * to the ClickHouse database for a given time chunk.
 * @param timeChunk The time chunk to sync the data for.
 */
export async function syncApexBankingTaps(timeChunk: PerformInTimeChunksItem) {
	//

	const chunkStartDate = Dates
		.fromUnixMilliseconds(timeChunk.start)
		.setZone('Europe/Lisbon', 'offset_only');

	const chunkEndDate = Dates
		.fromUnixMilliseconds(timeChunk.end)
		.setZone('Europe/Lisbon', 'offset_only');

	Logger.spacer(1);
	Logger.divider(`[${timeChunk.total - timeChunk.index}/${timeChunk.total}] - ${chunkEndDate.iso}[${timeChunk.end}] › ${chunkStartDate.iso}[${timeChunk.start}]`, 150);

	//
	// Prepare the PCGIDB query to retrieve documents
	// for the current timestamp chunk.

	const rawdbQuery: Filter<RawApexTransaction> = {
		created_at: {
			$gte: timeChunk.start,
			$lt: timeChunk.end,
		},
		version: { $in: ['banking-tap-4.0'] },
	};

	//
	// Implement the replication process using the generic replicate function from the utils package.
	// This function will handle the logic of counting, comparing, syncing and deleting documents
	// between the source and destination databases based on the provided functions.

	const rawApexTransactionsCollection = await rawDb.apex.transactions.getCollection();

	await replicate<RawApexTransaction>({

		countDestinationDbFn: async () => {
			return await labDb.simplifiedApex.bankingTaps.count(
				'*',
				'created_at >= $1 AND created_at < $2',
				{ 1: timeChunk.start, 2: timeChunk.end },
			);
		},

		countSourceDbFn: async () => {
			const result = await rawDb.apex.transactions.count(rawdbQuery);
			return result;
		},

		deleteDestinationDbFn: async (ids: string[]) => {
			await performInChunks(ids, async (chunk) => {
				await labDb.simplifiedApex.bankingTaps.delete(
					'_id IN $1',
					{ 1: chunk },
				);
			}, 1_000);
		},

		distinctDestinationDbFn: async () => {
			const result = await labDb.simplifiedApex.bankingTaps.distinct(
				'_id',
				'created_at >= $1 AND created_at < $2',
				{ 1: timeChunk.start, 2: timeChunk.end },
			);
			return result.map(id => String(id).toUpperCase());
		},

		distinctSourceDbFn: async () => {
			const result = await rawDb.apex.transactions.distinct('_id', rawdbQuery);
			return result.map(String);
		},

		missingDocumentsSourceDbAsyncIterator: (missingDocumentIds) => {
			return rawApexTransactionsCollection
				.find({ _id: { $in: missingDocumentIds } })
				.stream();
		},

		onCompleteCallbackFn: async () => {
			await writer.flush(setRidesAsWaiting);
		},

		writeSourceDocumentToDestinationDbFn: async (sourceDbDocument) => {
			try {
				let parseResult: null | SimplifiedApexBankingTap = null;
				if (sourceDbDocument.version === 'banking-tap-4.0') parseResult = parseRawApexTransactionBankingTapV40IntoSimplifiedApexBankingTap(sourceDbDocument);
				if (!parseResult) return;
				await writer.write(parseResult, { flushCallback: setRidesAsWaiting });
			} catch (error) {
				const errorMessage = error instanceof ZodError
					? error.issues.map(issue => `${issue.path.join('.')} ${issue.message}`).join('; ')
					: error instanceof Error ? error.message : String(error);
				Logger.error({ message: `Error transforming APEX Banking Tap: ${sourceDbDocument._id} Reason: ${errorMessage}` });
			}
		},

	});

	//
}
