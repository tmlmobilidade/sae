import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { UnixMillisecondsSchema } from '@tmlmobilidade/go-types-shared';
import { Logger } from '@tmlmobilidade/logger';

/* * */

const STALE_AFTER_MS = 5 * 60_000;

export async function recoverAbandonedPosterExports(): Promise<void> {
	const collection = await goDb.core.exports.getCollection();
	const result = await collection.updateMany({
		processing_status: 'processing',
		type: 'plan_posters',
		updated_at: { $lt: UnixMillisecondsSchema.parse(Date.now() - STALE_AFTER_MS) },
	}, { $set: { processing_status: 'error', updated_at: UnixMillisecondsSchema.parse(Date.now()) } });
	if (result.modifiedCount) {
		Logger.info({ message: `Marked ${result.modifiedCount} abandoned poster exports as error (no heartbeat for 5 minutes).` });
	}
}

export async function claimPosterExport(id: string) {
	const collection = await goDb.core.exports.getCollection();
	let updatedAt = UnixMillisecondsSchema.parse(Date.now());
	const claimed = await collection.findOneAndUpdate({ _id: id, processing_status: 'waiting', type: 'plan_posters' }, {
		$set: { processing_status: 'processing', updated_at: updatedAt },
	}, { returnDocument: 'after' });
	if (!claimed) return null;

	// Serialize heartbeats and completion, using the timestamp as a revision so a
	// recovered or externally changed job cannot be overwritten by an old worker.
	let pending = Promise.resolve();
	let finished = false;
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
			if (!result.matchedCount) {
				finished = true;
				throw new Error(`Poster export ${id} is no longer owned by this worker.`);
			}
			updatedAt = nextUpdatedAt;
			finished = status !== 'processing';
		});
		pending = operation.catch(() => {});
		return operation;
	};

	return {
		complete: (downloadUrl: string) => update('complete', downloadUrl),
		fail: () => update('error'),
		heartbeat: () => update('processing'),
	};
}
