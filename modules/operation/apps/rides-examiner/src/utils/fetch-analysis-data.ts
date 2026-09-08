/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type Ride } from '@tmlmobilidade/go-types-operation';
import { Dates } from '@tmlmobilidade/go-utils-dates';

import { type AnalysisData, type PickedSimplifiedApexBankingTap, type PickedSimplifiedApexLocation, type PickedSimplifiedApexOnBoardRefund, type PickedSimplifiedApexOnBoardSale, type PickedSimplifiedApexValidation, type PickedSimplifiedVehicleEvent } from '../types/analysis-data.js';

/* * */

export async function fetchAnalysisData(rideData: Ride): Promise<AnalysisData> {
	//

	//
	// For this ride, fetch all the necessary data for analysis.
	// This includes static data, like hashed shapes and trips, and dynamic data,
	// like vehicle events and apex transactions. Request all data in parallel.

	const standardWindowInterval = Dates.fromUnixMilliseconds(rideData.start_time_scheduled).std_window;

	//
	// Fetch data from LabDB in parallel.

	const simplifiedApexBankingTapsPromise = labDb.queryFromString<PickedSimplifiedApexBankingTap>(
		`
			SELECT group_dimension, mac_ase_counter_value, mac_sam_serial_number, vehicle_id
			FROM simplified_apex.banking_taps
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id },
	);

	const simplifiedApexLocationsPromise = labDb.queryFromString<PickedSimplifiedApexLocation>(
		`
			SELECT mac_ase_counter_value, mac_sam_serial_number, stop_id, vehicle_id
			FROM simplified_apex.locations
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id },
	);

	const simplifiedApexOnBoardRefundsPromise = labDb.queryFromString<PickedSimplifiedApexOnBoardRefund>(
		`
			SELECT mac_ase_counter_value, mac_sam_serial_number, price, vehicle_id
			FROM simplified_apex.refunds
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id },
	);

	const simplifiedApexOnBoardSalesPromise = labDb.queryFromString<PickedSimplifiedApexOnBoardSale>(
		`
			SELECT is_passenger, mac_ase_counter_value, mac_sam_serial_number, price, vehicle_id
			FROM simplified_apex.sales
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id },
	);

	const simplifiedApexValidationsPromise = labDb.queryFromString<PickedSimplifiedApexValidation>(
		`
			SELECT category, created_at, is_passenger, mac_ase_counter_value, mac_sam_serial_number, units_qty, vehicle_id
			FROM simplified_apex.validations
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id },
	);

	const hashedShapePromise = labDb.operation.hashedShapes.select(
		'shape_polyline',
		'_id = $1',
		{ 1: rideData.hashed_shape_id },
	);

	const hashedTripPromise = labDb.operation.hashedTrips.select(
		'stop_id, stop_lat, stop_lon, stop_sequence',
		'_id = $1',
		{ 1: rideData.hashed_trip_id },
	);

	const vehicleEventsPromise = labDb.queryFromString<PickedSimplifiedVehicleEvent>(
		`
			SELECT created_at, driver_id, latitude, longitude, odometer, received_at, stop_id, vehicle_id
			FROM operation.simplified_vehicle_events
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4 AND extra_trip_id IS NULL
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id },
	);

	const [
		simplifiedApexBankingTapsData,
		simplifiedApexLocationsData,
		simplifiedApexOnBoardRefundsData,
		simplifiedApexOnBoardSalesData,
		simplifiedApexValidationsData,
		hashedShapeData,
		hashedTripData,
		vehicleEventsData,
	] = await Promise.all([
		simplifiedApexBankingTapsPromise,
		simplifiedApexLocationsPromise,
		simplifiedApexOnBoardRefundsPromise,
		simplifiedApexOnBoardSalesPromise,
		simplifiedApexValidationsPromise,
		hashedShapePromise,
		hashedTripPromise,
		vehicleEventsPromise,
	]);

	return {
		apex_banking_taps: simplifiedApexBankingTapsData,
		apex_locations: simplifiedApexLocationsData,
		apex_refunds: simplifiedApexOnBoardRefundsData,
		apex_sales: simplifiedApexOnBoardSalesData,
		apex_validations: simplifiedApexValidationsData,
		hashed_shape: hashedShapeData?.length > 0 ? hashedShapeData[0] : null,
		hashed_trip: hashedTripData,
		ride: rideData,
		vehicle_events: vehicleEventsData,
	};
};
