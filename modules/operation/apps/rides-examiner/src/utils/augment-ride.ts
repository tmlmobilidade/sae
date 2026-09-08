/* * */

import { type AnalysisData } from '@/types/analysis-data.js';
import { detectEndEvent } from '@/utils/detect-end-event.js';
import { detectFirstEvent } from '@/utils/detect-first-event.js';
import { detectLastEvent } from '@/utils/detect-last-event.js';
import { detectStartEvent } from '@/utils/detect-start-event.js';
import { getObservedExtension } from '@/utils/get-observed-extension.js';
import { Ride } from '@tmlmobilidade/go-types-operation';

/**
 * Augments the ride data with additional information from the analysis data.
 * @param rideData The ride data to augment.
 * @param analysisData The analysis data containing vehicle events, APEX transactions, and other related information.
 * @returns The original Ride with augmented data.
 */
export function augmentRide(analysisData: AnalysisData): Ride {
	//

	const augmentedRide = analysisData.ride;

	//
	// Add the seen_at timestamps from the first and last events

	const detectedFirstEvent = detectFirstEvent(analysisData.vehicle_events);
	const detectedLastEvent = detectLastEvent(analysisData.vehicle_events);

	augmentedRide.seen_first_at = detectedFirstEvent?.created_at ?? null;
	augmentedRide.seen_last_at = detectedLastEvent?.created_at ?? null;

	//
	// Detect the start and end times for this Ride

	const detectedStartEvent = detectStartEvent(analysisData.hashed_trip, analysisData.hashed_shape, analysisData.vehicle_events);
	const detectedEndEvent = detectEndEvent(analysisData.hashed_shape, analysisData.vehicle_events);

	augmentedRide.start_time_observed = detectedStartEvent?.created_at ?? null;
	augmentedRide.end_time_observed = detectedEndEvent?.created_at ?? null;

	//
	// Get the observed extension from the vehicle odometer

	augmentedRide.extension_observed = getObservedExtension(detectedStartEvent, detectedEndEvent);

	//
	// Get the vehicle IDs found on the given analysis data

	const foundVehicleIds = new Set<string>();

	analysisData.apex_banking_taps.forEach(item => item.vehicle_id && foundVehicleIds.add(String(item.vehicle_id)));
	analysisData.apex_locations.forEach(item => item.vehicle_id && foundVehicleIds.add(String(item.vehicle_id)));
	analysisData.apex_refunds.forEach(item => item.vehicle_id && foundVehicleIds.add(String(item.vehicle_id)));
	analysisData.apex_sales.forEach(item => item.vehicle_id && foundVehicleIds.add(String(item.vehicle_id)));
	analysisData.apex_validations.forEach(item => item.vehicle_id && foundVehicleIds.add(String(item.vehicle_id)));
	analysisData.vehicle_events.forEach(item => item.vehicle_id && foundVehicleIds.add(String(item.vehicle_id)));

	augmentedRide.vehicle_ids = Array.from(foundVehicleIds);

	//
	// Get the driver IDs found on the given analysis data

	const foundDriverIds = new Set<string>();

	analysisData.vehicle_events.forEach(item => item.driver_id && foundDriverIds.add(item.driver_id));

	augmentedRide.driver_ids = Array.from(foundDriverIds);

	//
	// Add APEX transaction counters

	augmentedRide.apex_banking_taps_qty = analysisData.apex_banking_taps.reduce((acc, item) => acc + (item.group_dimension ?? 1), 0);
	augmentedRide.apex_banking_taps_amount = null;

	augmentedRide.apex_locations_qty = analysisData.apex_locations.length;

	augmentedRide.apex_refunds_qty = analysisData.apex_refunds.length;
	augmentedRide.apex_refunds_amount = analysisData.apex_refunds.reduce((acc, item) => acc + (item.price || 0), 0);

	augmentedRide.apex_sales_qty = analysisData.apex_sales.length;
	augmentedRide.apex_sales_amount = analysisData.apex_sales.reduce((acc, item) => acc + (item.price || 0), 0);

	augmentedRide.apex_validations_qty = analysisData.apex_validations.length;

	//
	// Add passenger counters from valid APEX Validations and On-Board Sales

	const validApexSales = analysisData.apex_sales.filter(item => item.is_passenger);
	const validApexValidations = analysisData.apex_validations.filter(item => item.is_passenger);

	augmentedRide.passengers_observed = validApexValidations.length + augmentedRide.apex_banking_taps_qty;

	augmentedRide.passengers_observed_subscription_qty = validApexValidations.filter(item => item.category === 'subscription').length;

	augmentedRide.passengers_observed_prepaid_qty = validApexValidations.filter(item => item.category === 'prepaid').length;
	augmentedRide.passengers_observed_prepaid_amount = validApexValidations.filter(item => item.category === 'prepaid').reduce((acc, item) => acc + (item.units_qty || 0), 0);

	augmentedRide.passengers_observed_sales_qty = validApexValidations.filter(item => item.category === 'on_board_sale').length;
	augmentedRide.passengers_observed_sales_amount = validApexSales.reduce((acc, item) => acc + (item.price || 0), 0);

	augmentedRide.passengers_observed_banking_taps_qty = augmentedRide.apex_banking_taps_qty;
	augmentedRide.passengers_observed_banking_taps_amount = null;

	//
	// Return the augmented Ride to the caller

	return augmentedRide;
}
