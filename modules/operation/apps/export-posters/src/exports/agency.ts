/* * */

import { type ExportToHitouchConfig } from '@/types.js';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { GtfsAgencySchema } from '@tmlmobilidade/go-types-gtfs';
import { type Plan } from '@tmlmobilidade/go-types-operation';
import { Logger } from '@tmlmobilidade/logger';
import { CsvWriter } from '@tmlmobilidade/writers';

/* * */

export async function exportAgencyFile(planData: Plan, exportConfig: ExportToHitouchConfig) {
	//
	// Export agency file

	const agencyCsv = new CsvWriter('agency.txt', `${exportConfig.workdir}/agency.txt`, { batch_size: 10000 });

	const agency = await goDb.core.agencies.findById(planData.agency_id);
	if (!agency) throw new Error(`Agency ${planData.agency_id} not found for poster export.`);

	await agencyCsv.write(GtfsAgencySchema.parse({
		agency_email: agency.open_data?.details?.email,
		agency_fare_url: agency.open_data?.details?.fare_url,
		agency_id: agency.code,
		agency_lang: agency.primary_language,
		agency_name: agency.name,
		agency_phone: agency.open_data?.details?.phone,
		agency_timezone: agency.timezone,
		agency_url: agency.open_data?.details?.website_url,
	}));

	await agencyCsv.flush();

	Logger.info({ message: 'Exported agency.txt file.' });
}
