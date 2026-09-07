/* * */

import { DAY_TYPES } from '@/day-types.js';
import { DayTypesExt, type ExportToHitouchConfig } from '@/types.js';
import { Logger } from '@tmlmobilidade/logger';
import fs from 'node:fs';
import Papa from 'papaparse';

/* * */

export async function exportDayTypesFile(exportConfig: ExportToHitouchConfig) {
	//
	// Export day types file

	const dayTypesExtFields: (keyof DayTypesExt)[] = ['day_type_id', 'name', 'sequence_number', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
	const dayTypesExtRows: DayTypesExt[] = DAY_TYPES.map((dayType) => {
		return {
			day_type_id: dayType._id,
			friday: '',
			monday: '',
			name: dayType.name,
			saturday: '',
			sequence_number: dayType.index,
			sunday: '',
			thursday: '',
			tuesday: '',
			wednesday: '',
		};
	});

	const dayTypesExtCsvData = Papa.unparse(
		{ data: dayTypesExtRows, fields: dayTypesExtFields },
		{
			newline: '\n',
			quotes: (value, columnIndex) => columnIndex < 2 && !dayTypesExtFields.includes(value),
		},
	);

	if (!fs.existsSync(exportConfig.workdir)) fs.mkdirSync(exportConfig.workdir, { recursive: true });
	fs.writeFileSync(`${exportConfig.workdir}/day_typesExt.txt`, dayTypesExtCsvData, { encoding: 'utf-8', flush: true });

	Logger.info({ message: 'Exported day_typesExt.txt file.' });
}
