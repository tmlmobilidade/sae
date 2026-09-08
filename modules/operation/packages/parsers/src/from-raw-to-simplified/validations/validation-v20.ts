/* * */

import { ApexEventTypeSchema, ApexValidationStatusSchema, type RawApexTransactionValidationV20, type SimplifiedApexValidation, SimplifiedApexValidationSchema } from '@tmlmobilidade/go-types-apex';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { toUInt64 } from '@tmlmobilidade/utils';

/* * */

export function parseRawApexTransactionValidationV20IntoSimplifiedApexValidation(doc: RawApexTransactionValidationV20): null | SimplifiedApexValidation {
	//

	//
	// Prepare the date field values

	const transactionDateValue = Dates
		.fromFormat(doc.payload.transactionInfo.transactionDate, 'yyyy-MM-dd\'T\'HH:mm:ss', 'Europe/Lisbon');

	//
	// Validate the document structure and content

	const result: SimplifiedApexValidation = {
		_id: doc.payload.transactionInfo.transactionId,
		agency_code: doc.payload.operatorInfo.operatorLongID,
		agency_id: doc.agency_id,
		apex_version: doc.payload.versionInfo.apexVersion,
		card_serial_number: toUInt64(doc.payload.cardInfo.cardSerialNumber),
		category: 'subscription',
		created_at: transactionDateValue.unix_milliseconds,
		device_id: doc.payload.operatorInfo.deviceID,
		event_type: ApexEventTypeSchema.parse(String(doc.payload.validationInfo.eventType)),
		is_ok: false,
		is_ok_pcgi: doc.is_ok,
		is_passenger: false,
		line_id: doc.payload.serviceInfo.lineLongID,
		mac_ase_counter_value: doc.payload.mac.aseCounterValue,
		mac_sam_serial_number: doc.payload.mac.samSerialNumber,
		on_board_refund_id: null,
		on_board_sale_id: null,
		operational_date: transactionDateValue.operational_date_int,
		pattern_id: doc.payload.serviceInfo.patternLongID,
		product_id: doc.payload.validationInfo.productLongID,
		received_at: doc.received_at,
		stop_id: doc.payload.serviceInfo.stopLongID,
		trip_id: doc.payload.serviceInfo.journeyID,
		units_qty: doc.payload.validationInfo.unitsQuantity,
		updated_at: Dates.now('utc').unix_milliseconds,
		validation_status: ApexValidationStatusSchema.parse(String(doc.payload.validationInfo.validationStatus)),
		vehicle_id: String(doc.payload.serviceInfo.vehicleID),
	};

	return SimplifiedApexValidationSchema.parse(result);
}
