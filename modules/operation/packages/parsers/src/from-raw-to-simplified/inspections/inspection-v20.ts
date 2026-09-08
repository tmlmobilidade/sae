/* * */

import { ApexControlStatusSchema, ApexEnvironmentStatusSchema, type RawApexTransactionInspectionV20, type SimplifiedApexInspection, SimplifiedApexInspectionSchema } from '@tmlmobilidade/go-types-apex';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { toUInt64 } from '@tmlmobilidade/utils';

/* * */

export function parseRawApexTransactionInspectionV20IntoSimplifiedApexInspection(doc: RawApexTransactionInspectionV20): null | SimplifiedApexInspection {
	//

	//
	// Prepare the date field values

	const transactionDateValue = Dates
		.fromFormat(doc.payload.transactionInfo.transactionDate, 'yyyy-MM-dd\'T\'HH:mm:ss', 'Europe/Lisbon');

	//
	// Validate the document structure and content

	const result: SimplifiedApexInspection = {
		_id: doc.payload.transactionInfo.transactionId,
		agency_code: doc.payload.operatorInfo.operatorLongID,
		agency_id: doc.agency_id,
		apex_version: doc.payload.versionInfo.apexVersion,
		card_serial_number: toUInt64(doc.payload.cardInfo.cardSerialNumber),
		control_destination_stop_id: doc.payload.controlServiceInfo.controlDestinationStopLongID,
		control_origin_stop_id: doc.payload.controlServiceInfo.controlOriginStopLongID,
		control_status: ApexControlStatusSchema.parse(String(doc.payload.controlInfo.controlStatus)),
		created_at: transactionDateValue.unix_milliseconds,
		device_id: doc.payload.operatorInfo.deviceID,
		environment_status: ApexEnvironmentStatusSchema.parse(String(doc.payload.controlInfo.environmentStatus)),
		inspection_id: null,
		is_ok: false,
		is_ok_pcgi: false,
		line_id: doc.payload.controlServiceInfo.lineLongID,
		mac_ase_counter_value: doc.payload.mac.aseCounterValue,
		mac_sam_serial_number: doc.payload.mac.samSerialNumber,
		operational_date: transactionDateValue.operational_date_int,
		pattern_id: doc.payload.controlServiceInfo.patternLongID,
		product_id: doc.payload.controlInfo.productLongID,
		received_at: doc.received_at,
		trip_id: doc.payload.controlServiceInfo.journeyID,
		updated_at: Dates.now('utc').unix_milliseconds,
		vehicle_id: String(doc.payload.controlServiceInfo.vehicleID),
	};

	return SimplifiedApexInspectionSchema.parse(result);
}
