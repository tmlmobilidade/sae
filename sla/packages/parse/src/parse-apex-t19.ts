/* * */

import type { ApexT19 } from '@tmlmobilidade/core/types';

import { getOperationalDate } from '@tmlmobilidade/core/utils';
import { DateTime } from 'luxon';

/* * */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseApexT19(pcgiDoc: any): ApexT19 {
	//

	const transactionDate = DateTime.fromISO(pcgiDoc.transaction.transactionDate);

	const operationalDate = getOperationalDate(transactionDate);

	return {
		_id: pcgiDoc.transaction.transactionId,
		agency_id: pcgiDoc.transaction.operatorLongID,
		apex_version: pcgiDoc.transaction.apexVersion,
		created_at: transactionDate.toJSDate(),
		device_id: pcgiDoc.transaction.deviceID,
		line_id: pcgiDoc.transaction.lineLongID,
		mac_ase_counter_value: pcgiDoc.transaction.macDataFields.aseCounterValue,
		mac_sam_serial_number: pcgiDoc.transaction.macDataFields.samSerialNumber,
		operational_date: operationalDate,
		pattern_id: pcgiDoc.transaction.patternLongID,
		received_at: DateTime.fromISO(pcgiDoc.createdAt).toJSDate(),
		stop_id: pcgiDoc.transaction.stopLongID,
		trip_id: pcgiDoc.transaction.journeyID,
		updated_at: DateTime.fromISO(pcgiDoc.createdAt).toJSDate(),
		vehicle_id: pcgiDoc.transaction.vehicleID,
	};

	//
}
