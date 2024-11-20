/* * */

import { AnalysisData } from '@/types/analysisData.type.js';
import { AnalysisResult, AnalysisResultGrade, AnalysisResultStatus } from '@/types/analysisResult.type.js';

/* * */

// This analyzer tests if at least one stop_id is found for each segment of the trip.
// The first three stops, the first middle 4 stops and the last 3 stops for each trip are saved.
// Then, a simple lookup for any of these Stop IDs is performed.
//
// GRADES:
// → PASS = At least one Stop ID is found for each segment of the trip.
// → FAIL = At least one segment without any matching stops.

/* * */

interface ExtendedAnalysisResult extends AnalysisResult {
	code: 'SIMPLE_THREE_VEHICLE_EVENTS'
	reason: 'ALL_STOPS_FOUND' | 'MISSING_FIRST_STOPS' | 'MISSING_LAST_STOPS' | 'MISSING_MIDDLE_STOPS'
	unit: null
	value: null
};

/* * */

export default (analysisData: AnalysisData): ExtendedAnalysisResult => {
	//

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
			if (firstStopIds.has(event.content.entity[0].vehicle.stopId)) {
				foundFirstStopIds.add(event.content.entity[0].vehicle.stopId);
			}
			if (middleStopIds.has(event.content.entity[0].vehicle.stopId)) {
				foundMiddleStopIds.add(event.content.entity[0].vehicle.stopId);
			}
			if (lastStopIds.has(event.content.entity[0].vehicle.stopId)) {
				foundLastStopIds.add(event.content.entity[0].vehicle.stopId);
			}
		}

		// 5.
		// Based on the test, attribute the grades

		if (!foundFirstStopIds.size) {
			return {
				code: 'SIMPLE_THREE_VEHICLE_EVENTS',
				grade: AnalysisResultGrade.FAIL,
				message: `None of the first ${firstStopIds.size} Stop IDs was found. [${Array.from(firstStopIds).join('|')}]`,
				reason: 'MISSING_FIRST_STOPS',
				status: AnalysisResultStatus.COMPLETE,
				unit: null,
				value: null,
			};
		}

		if (!foundMiddleStopIds.size) {
			return {
				code: 'SIMPLE_THREE_VEHICLE_EVENTS',
				grade: AnalysisResultGrade.FAIL,
				message: `None of the middle ${middleStopIds.size} Stop IDs was found. [${Array.from(middleStopIds).join('|')}]`,
				reason: 'MISSING_MIDDLE_STOPS',
				status: AnalysisResultStatus.COMPLETE,
				unit: null,
				value: null,
			};
		}

		if (!foundLastStopIds.size) {
			return {
				code: 'SIMPLE_THREE_VEHICLE_EVENTS',
				grade: AnalysisResultGrade.FAIL,
				message: `None of the last ${lastStopIds.size} Stop IDs was found. [${Array.from(lastStopIds).join('|')}]`,
				reason: 'MISSING_LAST_STOPS',
				status: AnalysisResultStatus.COMPLETE,
				unit: null,
				value: null,
			};
		}

		return {
			code: 'SIMPLE_THREE_VEHICLE_EVENTS',
			grade: AnalysisResultGrade.PASS,
			message: `Found at least one Stop ID for each section (first|middle|last). First: [${Array.from(foundFirstStopIds).join('|')}] | Middle: [${Array.from(foundMiddleStopIds).join('|')}] | Last: [${Array.from(foundLastStopIds).join('|')}]`,
			reason: 'ALL_STOPS_FOUND',
			status: AnalysisResultStatus.COMPLETE,
			unit: null,
			value: null,
		};

		//
	}
	catch (error) {
		console.log(error);
		return {
			code: 'SIMPLE_THREE_VEHICLE_EVENTS',
			grade: AnalysisResultGrade.FAIL,
			message: error.message,
			reason: null,
			status: AnalysisResultStatus.ERROR,
			unit: null,
			value: null,
		};
	}

	//
};
