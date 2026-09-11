import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { UnixMillisecondsSchema } from '@tmlmobilidade/go-types-shared';

/* * */

/**
 * Claim a poster export.
 * @param id - The ID of the poster export to claim.
 * @returns A function to update the status of the poster export.
 */
export async function claimPosterExport(id: string) {
	//

	//
	// Get the collection.

	const collection = await goDb.core.exports.getCollection();
	let updatedAt = UnixMillisecondsSchema.parse(Date.now());
	const claimed = await collection.findOneAndUpdate({ _id: id, processing_status: 'waiting', type: 'plan_posters' }, {
		$set: { processing_status: 'processing', updated_at: updatedAt },
	}, { returnDocument: 'after' });
	if (!claimed) return null;

	let pending = Promise.resolve();
	let finished = false;

	//
	// Update the status of the poster export.

	const update = (status: 'complete' | 'error' | 'processing', downloadUrl?: string) => {
		const operation = pending.then(async () => {
			if (finished) return;
			const nextUpdatedAt = UnixMillisecondsSchema.parse(Math.max(Date.now(), updatedAt + 1));
			const result = await collection.updateOne({ _id: id, processing_status: 'processing', type: 'plan_posters', updated_at: updatedAt }, {
				$set: {
					...(status === 'complete' ? { download_url: downloadUrl, file_id: null } : {}),
					processing_status: status,
					updated_at: nextUpdatedAt,
				},
			});
			//
			// If the poster export is no longer owned by this worker, throw an error.

			if (!result.matchedCount) {
				finished = true;
				throw new Error(`Poster export ${id} is no longer owned by this worker.`);
			}

			//
			// Update the timestamp and status of the poster export.

			updatedAt = nextUpdatedAt;
			finished = status !== 'processing';
		});
		pending = operation.catch(() => {});
		return operation;
	};

	//
	// Return the update functions.

	return {
		complete: (downloadUrl: string) => update('complete', downloadUrl),
		fail: () => update('error'),
		heartbeat: () => update('processing'),
	};
}
