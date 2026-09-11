/* * */

import { type ExportToHitouchConfig } from '@/types.js';
import { buildVariantNotes } from '@/utils/build-variant-notes.js';
import { GtfsShapesSchema } from '@tmlmobilidade/go-types-gtfs';
import { type GtfsStrictV29ExtSQLTables } from '@tmlmobilidade/import-gtfs';
import { Logger } from '@tmlmobilidade/logger';
import { CsvWriter } from '@tmlmobilidade/writers';

/* * */

/**
 * Export geometry and explicit pattern ordering to match the letters in stop-time notes.
 * @param sqlTables - The SQL tables to export from.
 * @param exportConfig - The export configuration.
 */
export async function exportShapesFiles(sqlTables: GtfsStrictV29ExtSQLTables, exportConfig: ExportToHitouchConfig) {
	//

	//
	// Export shapes.txt and shapesExt.txt

	const { shapeSequences } = buildVariantNotes(sqlTables.trips.all());
	const shapesCsv = new CsvWriter('shapes.txt', `${exportConfig.workdir}/shapes.txt`, { batch_size: 10000 });
	const shapesExtCsv = new CsvWriter('shapesExt.txt', `${exportConfig.workdir}/shapesExt.txt`, { batch_size: 10000, include_bom: true, new_line_character: '\r\n' });
	const extensionFields = ['shape_id', 'sequence_number', 'priority_number', 'note', 'direction_description', 'via_text'] as const;
	const exportedShapeIds = new Set<string>();

	//
	// Export shapes

	for (const shapeData of sqlTables.shapes.all('ORDER BY shape_id ASC, shape_pt_sequence ASC')) {
		//
		// Export shapes.txt

		const sequence = shapeSequences.get(shapeData.shape_id);
		if (!sequence) continue;
		await shapesCsv.write(GtfsShapesSchema.parse(shapeData));
		if (exportedShapeIds.has(shapeData.shape_id)) continue;

		//
		// Export shapesExt.txt

		const extension = {
			direction_description: '',
			note: '',
			priority_number: sequence === 1 ? 1 : 2,
			sequence_number: sequence,
			shape_id: shapeData.shape_id,
			via_text: '',
		};
		await shapesExtCsv.write(Object.fromEntries(extensionFields.map(field => [field, extension[field]])));
		exportedShapeIds.add(shapeData.shape_id);
	}

	//
	// Flush and Log

	await shapesCsv.flush();
	await shapesExtCsv.flush();
	Logger.info({ message: `Exported shapes.txt and shapesExt.txt for ${exportedShapeIds.size} patterns.` });
}
