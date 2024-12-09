/* * */

import type { ApexT11 } from '@tmlmobilidade/services/types';

import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';

/* * */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseApexT11(pcgiDoc: any): ApexT11 {
	//

	const transactionDate = DateTime.fromISO(pcgiDoc.transaction.transactionDate);

	const operationalDate = getOperationalDate(transactionDate);

	return {
		_id: pcgiDoc.transaction.transactionId,
		_raw: JSON.stringify(pcgiDoc),
		agency_id: pcgiDoc.transaction.operatorLongID,
		apex_version: pcgiDoc.transaction.apexVersion,
		card_serial_number: pcgiDoc.transaction.cardSerialNumber,
		created_at: transactionDate.toJSDate(),
		device_id: pcgiDoc.transaction.deviceID,
		line_id: pcgiDoc.transaction.lineLongID,
		mac_ase_counter_value: pcgiDoc.transaction.macDataFields.aseCounterValue,
		mac_sam_serial_number: pcgiDoc.transaction.macDataFields.samSerialNumber,
		operational_date: operationalDate,
		pattern_id: pcgiDoc.transaction.patternLongID,
		product_id: pcgiDoc.transaction.productLongID,
		received_at: DateTime.fromISO(pcgiDoc.createdAt).toJSDate(),
		stop_id: pcgiDoc.transaction.stopLongID,
		trip_id: pcgiDoc.transaction.journeyID,
		updated_at: DateTime.fromISO(pcgiDoc.createdAt).toJSDate(),
		validation_status: pcgiDoc.transaction.validationStatus,
		vehicle_id: pcgiDoc.transaction.vehicleID,
	};

	//
}
