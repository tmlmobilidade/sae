/* * */

import { rides } from '@tmlmobilidade/services/interfaces';
import { createOperationalDate } from '@tmlmobilidade/services/types';
import { DateTime } from 'luxon';

/* * */

export async function GET(request: Request, { params }: { params: Promise<{ operational_date: string }> }) {
	try {
		//

		//
		// Refuse if method is not GET

		if (request.method !== 'GET') {
			throw new Error('Request method not allowed.');
		}

		const reqParams = await params;

		//
		// Setup timestamp boundaries

		if (!reqParams.operational_date || reqParams.operational_date.length !== 8) return Response.json({ message: 'Invalid operational_date param.' }, { status: 400 });

		const operationalDate = createOperationalDate(reqParams.operational_date);

		//
		// Setup the response JSON object

		const responseResult = {

			// For Area 1
			_41_scheduled_rides_operational_day: 0,
			_41_scheduled_rides_until_now: 0,
			_41_simple_three_events_or_validation_pass_until_now: 0,
			_41_simple_three_events_pass_until_now: 0,

			// For Area 2
			_42_scheduled_rides_operational_day: 0,
			_42_scheduled_rides_until_now: 0,
			_42_simple_three_events_or_validation_pass_until_now: 0,
			_42_simple_three_events_pass_until_now: 0,

			// For Area 3
			_43_scheduled_rides_operational_day: 0,
			_43_scheduled_rides_until_now: 0,
			_43_simple_three_events_or_validation_pass_until_now: 0,
			_43_simple_three_events_pass_until_now: 0,

			// For Area 4
			_44_scheduled_rides_operational_day: 0,
			_44_scheduled_rides_until_now: 0,
			_44_simple_three_events_or_validation_pass_until_now: 0,
			_44_simple_three_events_pass_until_now: 0,

			// For the whole CM
			_cm_scheduled_rides_operational_day: 0,
			_cm_scheduled_rides_until_now: 0,
			_cm_simple_three_events_or_validation_pass_until_now: 0,
			_cm_simple_three_events_pass_until_now: 0,

			//
		};

		//
		// Get all rides for today

		const ridesCollection = await rides.getCollection();
		const allRidesForTodayStream = ridesCollection.find({ operational_date: operationalDate }).stream();

		//
		// Iterate on all rides for today

		for await (const rideData of allRidesForTodayStream) {
			//

			//
			// Update the count variables

			responseResult._cm_scheduled_rides_operational_day++;

			if (rideData.agency_id === '41') responseResult._41_scheduled_rides_operational_day++;
			if (rideData.agency_id === '42') responseResult._42_scheduled_rides_operational_day++;
			if (rideData.agency_id === '43') responseResult._43_scheduled_rides_operational_day++;
			if (rideData.agency_id === '44') responseResult._44_scheduled_rides_operational_day++;

			//
			// Only consider rides that have already started (schedule start before now)
			// or have already been processed.

			const rideStartedBeforeNow = DateTime.fromJSDate(rideData.start_time_scheduled).toMillis() < DateTime.now().minus({ minutes: 60 }).toMillis();

			const rideHasBeenProcessed = rideData.status === 'complete' && rideData.analysis.length > 0;

			if (!rideStartedBeforeNow || !rideHasBeenProcessed) continue;

			//
			// Update the count variables

			responseResult._cm_scheduled_rides_until_now++;

			if (rideData.agency_id === '41') responseResult._41_scheduled_rides_until_now++;
			if (rideData.agency_id === '42') responseResult._42_scheduled_rides_until_now++;
			if (rideData.agency_id === '43') responseResult._43_scheduled_rides_until_now++;
			if (rideData.agency_id === '44') responseResult._44_scheduled_rides_until_now++;

			//
			// Check if the ride passed the SIMPLE_THREE_VEHICLE_EVENTS validation,
			// and if it passed the combination of SIMPLE_THREE_VEHICLE_EVENTS and SIMPLE_ONE_VALIDATION_TRANSACTION validations

			const simpleThreeVehicleEvents = rideData.analysis.find(item => item._id === 'SIMPLE_THREE_VEHICLE_EVENTS');
			const simpleOneValidationTransaction = rideData.analysis.find(item => item._id === 'SIMPLE_ONE_VALIDATION_TRANSACTION');

			if (simpleThreeVehicleEvents?.grade === 'pass') {
				responseResult._cm_simple_three_events_pass_until_now++;
				if (rideData.agency_id === '41') responseResult._41_simple_three_events_pass_until_now++;
				if (rideData.agency_id === '42') responseResult._42_simple_three_events_pass_until_now++;
				if (rideData.agency_id === '43') responseResult._43_simple_three_events_pass_until_now++;
				if (rideData.agency_id === '44') responseResult._44_simple_three_events_pass_until_now++;
			}

			if (simpleThreeVehicleEvents?.grade === 'pass' || simpleOneValidationTransaction?.grade === 'pass') {
				responseResult._cm_simple_three_events_or_validation_pass_until_now++;
				if (rideData.agency_id === '41') responseResult._41_simple_three_events_or_validation_pass_until_now++;
				if (rideData.agency_id === '42') responseResult._42_simple_three_events_or_validation_pass_until_now++;
				if (rideData.agency_id === '43') responseResult._43_simple_three_events_or_validation_pass_until_now++;
				if (rideData.agency_id === '44') responseResult._44_simple_three_events_or_validation_pass_until_now++;
			}

			//
		}

		//
		// Send response

		return Response.json({
			data: responseResult,
			timestamp: DateTime.now().toMillis(),
		});

		//
	}
	catch (err) {
		console.log(err);
		return Response.json({ message: 'Cannot send responseResult.' }, { status: 500 });
	}
}
