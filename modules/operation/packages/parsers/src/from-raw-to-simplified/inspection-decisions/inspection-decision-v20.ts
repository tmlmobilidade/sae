/* * */

import { ApexControlStatusSchema, type RawApexTransactionInspectionDecisionV20, type SimplifiedApexInspectionDecision, SimplifiedApexInspectionDecisionSchema } from '@tmlmobilidade/go-types-apex';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

export function parseRawApexTransactionInspectionDecisionV20IntoSimplifiedApexInspectionDecision(doc: RawApexTransactionInspectionDecisionV20): null | SimplifiedApexInspectionDecision {
	//

	//
	// Prepare the date field values

	const transactionDateValue = Dates
		.fromFormat(doc.payload.transactionInfo.transactionDate, 'yyyy-MM-dd\'T\'HH:mm:ss', 'Europe/Lisbon');

	//
	// Validate the document structure and content

	const result: SimplifiedApexInspectionDecision = {
		_id: doc.payload.transactionInfo.transactionId,
		agency_code: doc.payload.operatorInfo.operatorLongID,
		agency_id: doc.agency_id,
		apex_version: doc.payload.versionInfo.apexVersion,
		created_at: transactionDateValue.unix_milliseconds,
		device_id: doc.payload.operatorInfo.deviceID,
		final_control_status: ApexControlStatusSchema.parse(String(doc.payload.controlAckInfo.finalControlStatus)),
		inspection_id: doc.payload.controlAckInfo.corrControlTransactionID,
		is_ok: false,
		is_ok_pcgi: doc.is_ok,
		mac_ase_counter_value: doc.payload.mac.aseCounterValue,
		mac_sam_serial_number: doc.payload.mac.samSerialNumber,
		operational_date: transactionDateValue.operational_date_int,
		received_at: doc.received_at,
		updated_at: Dates.now('utc').unix_milliseconds,
	};

	return SimplifiedApexInspectionDecisionSchema.parse(result);
}
