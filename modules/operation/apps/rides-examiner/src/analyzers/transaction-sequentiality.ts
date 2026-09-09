/* * */

import { type RideAnalysisTransactionSequentiality, RideAnalysisTransactionSequentialitySchema } from '@tmlmobilidade/go-types-operation';
import { Dates } from '@tmlmobilidade/go-utils-dates';

import { type AnalysisData } from '../types/analysis-data.js';

/**
 * This analyzer tests if there are any missing Transactions for the given Ride.
 *
 * GRADES:
 * → PASS = There are no gaps in the sequence of Transactions.
 * → FAIL = At least one Transaction is missing.
 */
export function transactionSequentialityAnalyzer(analysisData: AnalysisData): RideAnalysisTransactionSequentiality {
	try {
		//

		//
		// Skip if no transactions found

		const noTransactionsFound =
			!analysisData.apex_banking_taps.length
			&& !analysisData.apex_locations.length
			&& !analysisData.apex_refunds.length
			&& !analysisData.apex_sales.length
			&& !analysisData.apex_validations.length;

		if (noTransactionsFound) {
			return RideAnalysisTransactionSequentialitySchema.parse({
				agency_id: analysisData.ride.agency_id,
				expected_transactions_qty: null,
				found_transactions_qty: null,
				grade_status: 'skip',
				missing_transactions_qty: null,
				operational_date: analysisData.ride.operational_date,
				reason: 'NO_TRANSACTIONS',
				remarks: null,
				ride_id: analysisData.ride._id,
				updated_at: Dates.now('utc').unix_milliseconds,
			});
		}

		//
		// Combine transactions into a single array

		const allApexTransactions = [
			...analysisData.apex_banking_taps,
			...analysisData.apex_locations,
			...analysisData.apex_refunds,
			...analysisData.apex_sales,
			...analysisData.apex_validations,
		];

		//
		// Group ASE Counter Values by SAM Serial Number
		// and sort them by created_at timestamp

		const aseCounterValuesBySamSerialNumber: Record<string, number[]> = {};

		for (const apexTx of allApexTransactions) {
			// Skip if the SAM Serial Number is not available
			if (!apexTx.mac_sam_serial_number) continue;
			// Initialize the array if it doesn't exist
			if (!aseCounterValuesBySamSerialNumber[apexTx.mac_sam_serial_number]) aseCounterValuesBySamSerialNumber[apexTx.mac_sam_serial_number] = [];
			// Add the ASE Counter Value to the corresponding array
			aseCounterValuesBySamSerialNumber[apexTx.mac_sam_serial_number].push(apexTx.mac_ase_counter_value);
		}

		//
		// With the transactions organized by their SAM Serial Number,
		// we can now check if there are any gaps in the sequence of Transactions.

		let expectedTransactionsQty = 0;
		let foundTransactionsQty = 0;
		let missingTransactionsQty = 0;

		const missingTransactions: Record<string, number[]> = {};

		for (const [samSerialNumber, aseCounterValues] of Object.entries(aseCounterValuesBySamSerialNumber)) {
			// Sort the ASE Counter Values in ascending order
			aseCounterValues.sort((a, b) => a - b);
			// Add the expected and found quantities for this SAM Serial Number
			expectedTransactionsQty += aseCounterValues[aseCounterValues.length - 1] - aseCounterValues[0] + 1;
			foundTransactionsQty += aseCounterValues.length;
			// Check for gaps in the sequence
			const gaps: number[] = [];
			for (let i = 0; i < aseCounterValues.length - 1; i++) {
				const currentValue = aseCounterValues[i];
				const nextValue = aseCounterValues[i + 1];
				// If the difference between the current and next value
				// is greater than 1, there is a gap
				if (nextValue - currentValue > 1) {
					// Add the missing values to the gaps array
					for (let j = currentValue + 1; j < nextValue; j++) {
						gaps.push(j);
					}
				}
			}
			// If there are gaps, add them to the missingTransactions map
			if (gaps.length > 0) missingTransactions[samSerialNumber] = gaps;
			missingTransactionsQty += gaps.length;
		}

		if (Object.keys(missingTransactions).length === 0) {
			return RideAnalysisTransactionSequentialitySchema.parse({
				agency_id: analysisData.ride.agency_id,
				expected_transactions_qty: expectedTransactionsQty,
				found_transactions_qty: foundTransactionsQty,
				grade_status: 'pass',
				missing_transactions_qty: missingTransactionsQty,
				operational_date: analysisData.ride.operational_date,
				reason: 'ALL_TRANSACTIONS_RECEIVED',
				remarks: null,
				ride_id: analysisData.ride._id,
				updated_at: Dates.now('utc').unix_milliseconds,
			});
		}

		return RideAnalysisTransactionSequentialitySchema.parse({
			agency_id: analysisData.ride.agency_id,
			expected_transactions_qty: expectedTransactionsQty,
			found_transactions_qty: foundTransactionsQty,
			grade_status: 'fail',
			missing_transactions_qty: missingTransactionsQty,
			operational_date: analysisData.ride.operational_date,
			reason: 'MISSING_TRANSACTIONS',
			remarks: null,
			ride_id: analysisData.ride._id,
			updated_at: Dates.now('utc').unix_milliseconds,
		});

		//
	} catch (error) {
		return RideAnalysisTransactionSequentialitySchema.parse({
			agency_id: analysisData.ride.agency_id,
			expected_transactions_qty: null,
			found_transactions_qty: null,
			grade_status: 'error',
			missing_transactions_qty: null,
			operational_date: analysisData.ride.operational_date,
			reason: null,
			remarks: error.message,
			ride_id: analysisData.ride._id,
			updated_at: Dates.now('utc').unix_milliseconds,
		});
	}
};
