/* * */

import { AnalysisData } from '@/types/analysis-data.type.js';
import { RideAnalysis } from '@tmlmobilidade/services/types';

/* * */

interface ExplicitRideAnalysis extends RideAnalysis {
	_id: 'SIMPLE_THREE_VEHICLE_EVENTS'
	reason: 'ALL_STOPS_FOUND' | 'MISSING_FIRST_STOPS' | 'MISSING_LAST_STOPS' | 'MISSING_MIDDLE_STOPS'
};

/**
 * This analyzer tests if at least one stop_id is found for each segment of the trip.
 * The first three stops, the first middle 4 stops and the last 3 stops for each trip are saved.
 * Then, a simple lookup for any of these Stop IDs is performed.
 *
 * GRADES:
 * → PASS = At least one Stop ID is found for each segment of the trip.
 * → FAIL = At least one segment without any matching stops.
 */
export function simpleThreeVehicleEventsAnalyzer(analysisData: AnalysisData): ExplicitRideAnalysis {
	try {
		//

		// 1.
		// Sort the path by stop_sequence

		const sortedTripPath = analysisData.hashed_trip.path.sort((a, b) => {
			return a.stop_sequence - b.stop_sequence;
		});

		// 2.
		// Initiate a Set for each segment

		const firstStopIds = new Set();
		const foundFirstStopIds = new Set();

		const middleStopIds = new Set();
		const foundMiddleStopIds = new Set();

		const lastStopIds = new Set();
		const foundLastStopIds = new Set();

		// 3.
		// Get stops for each segment

		// Get first three stops of trip
		sortedTripPath.slice(0, 2).forEach(item => firstStopIds.add(item.stop_id));
		// Get middle three stops of trip
		const middlePathLength = Math.floor(sortedTripPath.length / 2);
		sortedTripPath.slice(middlePathLength - 2, middlePathLength + 2).forEach(item => middleStopIds.add(item.stop_id));
		// Get last three stops of trip
		sortedTripPath.slice(-2).forEach(item => lastStopIds.add(item.stop_id));

		// 4.
		// Test if at least one stop is found for each segment

		for (const event of analysisData.vehicle_events) {
			if (firstStopIds.has(event.stop_id)) {
				foundFirstStopIds.add(event.stop_id);
			}
			if (middleStopIds.has(event.stop_id)) {
				foundMiddleStopIds.add(event.stop_id);
			}
			if (lastStopIds.has(event.stop_id)) {
				foundLastStopIds.add(event.stop_id);
			}
		}

		// 5.
		// Based on the test, attribute the grades

		if (!foundFirstStopIds.size) {
			return {
				_id: 'SIMPLE_THREE_VEHICLE_EVENTS',
				grade: 'fail',
				message: `None of the first ${firstStopIds.size} Stop IDs was found. [${Array.from(firstStopIds).join('|')}]`,
				reason: 'MISSING_FIRST_STOPS',
				unit: null,
				value: null,
			};
		}

		if (!foundMiddleStopIds.size) {
			return {
				_id: 'SIMPLE_THREE_VEHICLE_EVENTS',
				grade: 'fail',
				message: `None of the middle ${middleStopIds.size} Stop IDs was found. [${Array.from(middleStopIds).join('|')}]`,
				reason: 'MISSING_MIDDLE_STOPS',
				unit: null,
				value: null,
			};
		}

		if (!foundLastStopIds.size) {
			return {
				_id: 'SIMPLE_THREE_VEHICLE_EVENTS',
				grade: 'fail',
				message: `None of the last ${lastStopIds.size} Stop IDs was found. [${Array.from(lastStopIds).join('|')}]`,
				reason: 'MISSING_LAST_STOPS',
				unit: null,
				value: null,
			};
		}

		return {
			_id: 'SIMPLE_THREE_VEHICLE_EVENTS',
			grade: 'pass',
			message: `Found at least one Stop ID for each section (first|middle|last). First: [${Array.from(foundFirstStopIds).join('|')}] | Middle: [${Array.from(foundMiddleStopIds).join('|')}] | Last: [${Array.from(foundLastStopIds).join('|')}]`,
			reason: 'ALL_STOPS_FOUND',
			unit: null,
			value: null,
		};

		//
	}
	catch (error) {
		return {
			_id: 'SIMPLE_THREE_VEHICLE_EVENTS',
			grade: 'error',
			message: error.message,
			reason: null,
			unit: null,
			value: null,
		};
	}
};
