/* * */

import { type RawApexTransactionLocationV30, type SimplifiedApexLocation, SimplifiedApexLocationSchema } from '@tmlmobilidade/go-types-apex';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

export function parseRawApexTransactionLocationV30IntoSimplifiedApexLocation(doc: RawApexTransactionLocationV30): null | SimplifiedApexLocation {
	//

	//
	// Prepare the date field values

	const transactionDateValue = Dates
		.fromFormat(doc.payload.transactionInfo.transactionDate, 'yyyy-MM-dd\'T\'HH:mm:ss', 'Europe/Lisbon');

	//
	// Validate the document structure and content

	const result: SimplifiedApexLocation = {
		_id: doc.payload.transactionInfo.transactionId,
		agency_code: doc.payload.operatorInfo.operatorLongID,
		agency_id: doc.agency_id,
		apex_version: doc.payload.versionInfo.apexVersion,
		created_at: transactionDateValue.unix_milliseconds,
		device_id: doc.payload.operatorInfo.deviceID,
		is_ok: false,
		is_ok_pcgi: doc.is_ok,
		line_id: doc.payload.validationServiceInfo.lineLongID,
		mac_ase_counter_value: doc.payload.mac.aseCounterValue,
		mac_sam_serial_number: doc.payload.mac.samSerialNumber,
		operational_date: transactionDateValue.operational_date_int,
		pattern_id: doc.payload.validationServiceInfo.patternLongID,
		received_at: doc.received_at,
		stop_id: doc.payload.validationServiceInfo.stopLongID,
		trip_id: doc.payload.validationServiceInfo.journeyID,
		updated_at: Dates.now('utc').unix_milliseconds,
		vehicle_id: String(doc.payload.validationServiceInfo.vehicleID),
	};

	return SimplifiedApexLocationSchema.parse(result);
}
