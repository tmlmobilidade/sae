/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { EncodedPolyline } from '@tmlmobilidade/go-types-geo';
import { BatchWriter } from '@tmlmobilidade/go-utils-exec';
import { chunkLineStringByDistance, fromEncodedPolylineToGeoJsonLineString, geohashEncode } from '@tmlmobilidade/go-utils-geo';

/* * */

/** Matches snap-join precision in build-hist-node-travel-times.sql (`geohashesInBox(..., 6)`). */

const BATCH_SIZE = 10_000;
const TABLE = 'eta.hist_shape_nodes';

/* * */

interface HistShapeRow {
	hashed_shape_id: string
	shape_polyline: EncodedPolyline
}

interface HistShapeNode {
	geohash: string
	hashed_shape_id: string
	latitude: number
	longitude: number
	node_index: number
}

/* * */

/**
 * Densifies distinct historical ride shapes into equidistant nodes and
 * inserts them into `eta.hist_shape_nodes` for spatial snapping.
 *
 * For each unique `(hashed_shape_id, shape_polyline)` in `eta.hist_rides`:
 * 1. Decode the encoded polyline to a GeoJSON LineString.
 * 2. Resample it every `chunkLengthMeters` along the path.
 * 3. Write each node with lat/lon and a geohash-7 cell (bloom-filter lookups).
 *
 * @param chunkLengthMeters - Target spacing between consecutive shape nodes.
 */
export async function loadHistoricalShapeNodes(chunkLengthMeters: number, geohashPrefixLength: number): Promise<void> {
	const shapes = await labDb.queryFromString<HistShapeRow>(`
		SELECT DISTINCT hashed_shape_id, shape_polyline
		FROM eta.hist_rides
	`);

	const client = await labDb.getClient();
	const writer = new BatchWriter<HistShapeNode>({
		batch_size: BATCH_SIZE,
		insertFn: async (values) => {
			await client.insert({
				format: 'JSONEachRow',
				table: TABLE,
				values,
			});
		},
		title: TABLE,
	});

	for (const shape of shapes) {
		if (!shape.shape_polyline || !shape.hashed_shape_id) continue;

		const line = fromEncodedPolylineToGeoJsonLineString(shape.shape_polyline);
		const nodes = chunkLineStringByDistance(line, chunkLengthMeters);

		for (const [nodeIndex, [longitude, latitude]] of nodes.coordinates.entries()) {
			await writer.write({
				geohash: geohashEncode(latitude, longitude, geohashPrefixLength),
				hashed_shape_id: shape.hashed_shape_id,
				latitude,
				longitude,
				node_index: nodeIndex,
			});
		}
	}

	await writer.flush();
}
