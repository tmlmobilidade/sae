/* * */

import { ApexBankingBrandSchema, type RawApexTransactionBankingTapV40, type SimplifiedApexBankingTap, SimplifiedApexBankingTapSchema } from '@tmlmobilidade/go-types-apex';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

export function parseRawApexTransactionBankingTapV40IntoSimplifiedApexBankingTap(doc: RawApexTransactionBankingTapV40): null | SimplifiedApexBankingTap {
	//

	//
	// Prepare the date field values

	const transactionDateValue = Dates
		.fromFormat(doc.payload.transactionInfo.transactionDate, 'yyyy-MM-dd\'T\'HH:mm:ss', 'Europe/Lisbon');

	//
	// Validate the document structure and content

	const result: SimplifiedApexBankingTap = {
		_id: doc.payload.transactionInfo.transactionId,
		agency_code: doc.payload.operatorInfo.operatorLongID,
		agency_id: doc.agency_id,
		apex_version: doc.payload.versionInfo.apexVersion,
		banking_tap_id: doc.payload.tapInInfo.bankingTapID,
		banking_token: doc.payload.tapInInfo.bankingToken,
		card_brand: ApexBankingBrandSchema.parse(String(doc.payload.tapInInfo.cardBrand)),
		card_pan: doc.payload.tapInInfo.cardPan,
		created_at: transactionDateValue.unix_milliseconds,
		device_id: doc.payload.operatorInfo.deviceID,
		event_type: null,
		group_dimension: doc.payload.tapInInfo.groupDimension,
		is_ok: false,
		is_ok_pcgi: doc.is_ok,
		line_id: doc.payload.serviceInfo.lineLongID,
		mac_ase_counter_value: doc.payload.mac.aseCounterValue,
		mac_sam_serial_number: doc.payload.mac.samSerialNumber,
		operational_date: transactionDateValue.operational_date_int,
		pattern_id: doc.payload.serviceInfo.patternLongID,
		product_id: doc.payload.tapInInfo.productLongID,
		received_at: doc.received_at,
		stop_id: doc.payload.serviceInfo.stopLongID,
		trip_id: doc.payload.serviceInfo.journeyID,
		updated_at: Dates.now('utc').unix_milliseconds,
		vehicle_id: String(doc.payload.serviceInfo.vehicleID),
	};

	return SimplifiedApexBankingTapSchema.parse(result);
}
