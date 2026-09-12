/* * */

import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type Ride } from '@tmlmobilidade/go-types-operation';
import { Dates } from '@tmlmobilidade/go-utils-dates';

import { type AnalysisData, type PickedSimplifiedApexBankingTap, type PickedSimplifiedApexLocation, type PickedSimplifiedApexOnBoardRefund, type PickedSimplifiedApexOnBoardSale, type PickedSimplifiedApexValidation, type PickedSimplifiedVehicleEvent } from '../types/analysis-data.js';
import { getHashedShape, getHashedTrip } from './hashed-cache.js';
import { LABDB_QUERY_SETTINGS } from './labdb-query-settings.js';

/* * */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function fetchAnalysisData(rideData: Ride): Promise<AnalysisData> {
	//

	//
	// For this ride, fetch all the necessary data for analysis.
	// This includes static data, like hashed shapes and trips, and dynamic data,
	// like vehicle events and apex transactions. Request all data in parallel.

	const standardWindowInterval = Dates.fromUnixMilliseconds(rideData.start_time_scheduled).std_window;

	//
	// Telemetry tables are partitioned by intDiv(operational_date, 100). Restrict every telemetry query
	// to the partitions that can hold rows of this window, otherwise ClickHouse has to consider every part
	// of the table on each execution. The operational date of a row is derived from its created_at with the
	// same rule the parsers use; pad the window by one day on each side so day-boundary rules never exclude
	// a partition. The result is one month, or two around a month boundary.

	const partitionMonthFrom = Math.floor(Dates.fromUnixMilliseconds(standardWindowInterval.start - ONE_DAY_MS).operational_date_int / 100);
	const partitionMonthTo = Math.floor(Dates.fromUnixMilliseconds(standardWindowInterval.end + ONE_DAY_MS).operational_date_int / 100);

	//
	// Fetch data from LabDB in parallel.

	const simplifiedApexBankingTapsPromise = labDb.queryFromString<PickedSimplifiedApexBankingTap>(
		`
			SELECT group_dimension, mac_ase_counter_value, mac_sam_serial_number, vehicle_id
			FROM simplified_apex.banking_taps
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4
			AND intDiv(operational_date, 100) BETWEEN $5 AND $6
			${LABDB_QUERY_SETTINGS}
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id, 5: partitionMonthFrom, 6: partitionMonthTo },
	);

	const simplifiedApexLocationsPromise = labDb.queryFromString<PickedSimplifiedApexLocation>(
		`
			SELECT mac_ase_counter_value, mac_sam_serial_number, stop_id, vehicle_id
			FROM simplified_apex.locations
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4
			AND intDiv(operational_date, 100) BETWEEN $5 AND $6
			${LABDB_QUERY_SETTINGS}
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id, 5: partitionMonthFrom, 6: partitionMonthTo },
	);

	const simplifiedApexOnBoardRefundsPromise = labDb.queryFromString<PickedSimplifiedApexOnBoardRefund>(
		`
			SELECT mac_ase_counter_value, mac_sam_serial_number, price, vehicle_id
			FROM simplified_apex.refunds
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4
			AND intDiv(operational_date, 100) BETWEEN $5 AND $6
			${LABDB_QUERY_SETTINGS}
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id, 5: partitionMonthFrom, 6: partitionMonthTo },
	);

	const simplifiedApexOnBoardSalesPromise = labDb.queryFromString<PickedSimplifiedApexOnBoardSale>(
		`
			SELECT is_passenger, mac_ase_counter_value, mac_sam_serial_number, price, vehicle_id
			FROM simplified_apex.sales
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4
			AND intDiv(operational_date, 100) BETWEEN $5 AND $6
			${LABDB_QUERY_SETTINGS}
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id, 5: partitionMonthFrom, 6: partitionMonthTo },
	);

	const simplifiedApexValidationsPromise = labDb.queryFromString<PickedSimplifiedApexValidation>(
		`
			SELECT category, created_at, is_passenger, mac_ase_counter_value, mac_sam_serial_number, units_qty, vehicle_id
			FROM simplified_apex.validations
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4
			AND intDiv(operational_date, 100) BETWEEN $5 AND $6
			${LABDB_QUERY_SETTINGS}
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id, 5: partitionMonthFrom, 6: partitionMonthTo },
	);

	//
	// Hashed shapes and trips are immutable and shared by every ride of the same pattern,
	// so they are served from a process-local cache (see hashed-cache.ts).

	const hashedShapePromise = getHashedShape(rideData.hashed_shape_id);

	const hashedTripPromise = getHashedTrip(rideData.hashed_trip_id);

	const vehicleEventsPromise = labDb.queryFromString<PickedSimplifiedVehicleEvent>(
		`
			SELECT created_at, driver_id, latitude, longitude, odometer, received_at, stop_id, vehicle_id
			FROM operation.simplified_vehicle_events
			WHERE created_at >= $1 AND created_at <= $2 AND agency_id = $3 AND trip_id = $4 AND extra_trip_id IS NULL
			AND intDiv(operational_date, 100) BETWEEN $5 AND $6
			${LABDB_QUERY_SETTINGS}
		`,
		{ 1: standardWindowInterval.start, 2: standardWindowInterval.end, 3: rideData.agency_id, 4: rideData.trip_id, 5: partitionMonthFrom, 6: partitionMonthTo },
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
		hashed_shape: hashedShapeData,
		hashed_trip: hashedTripData,
		ride: rideData,
		vehicle_events: vehicleEventsData,
	};
};
