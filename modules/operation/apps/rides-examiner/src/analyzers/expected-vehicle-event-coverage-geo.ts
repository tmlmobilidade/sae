/* * */

import { type RideAnalysisExpectedVehicleEventCoverageGeo, RideAnalysisExpectedVehicleEventCoverageGeoSchema } from '@tmlmobilidade/go-types-operation';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { getDistanceBetweenPositions } from '@tmlmobilidade/go-utils-geo';

import { type AnalysisData } from '../types/analysis-data.js';

/* * */

const BUFFER_RADIUS = 75; // meters

/**
 * This analyzer tests if at least 90% of all stops are covered by at least one vehicle event,
 * using the GPS coordinates of the vehicle events and the geofences of the stops.
 *
 * GRADES:
 * → PASS = At least 90% of all stops are covered by at least one vehicle event.
 * → FAIL = Less than 90% of all stops are covered by at least one vehicle event.
 */
export function expectedVehicleEventCoverageGeoAnalyzer(analysisData: AnalysisData): RideAnalysisExpectedVehicleEventCoverageGeo {
	try {
		//

		if (!analysisData.hashed_trip?.length) {
			return RideAnalysisExpectedVehicleEventCoverageGeoSchema.parse({
				agency_id: analysisData.ride.agency_id,
				grade_status: 'skip',
				operational_date: analysisData.ride.operational_date,
				reason: 'NO_PATH_DATA',
				remarks: null,
				ride_id: analysisData.ride._id,
				stops_covered_absolute: null,
				stops_covered_percentage: null,
				stops_not_covered_ids: null,
				stops_qty: null,
				updated_at: Dates.now('utc').unix_milliseconds,
			});
		}

		if (!analysisData.vehicle_events.length) {
			return RideAnalysisExpectedVehicleEventCoverageGeoSchema.parse({
				agency_id: analysisData.ride.agency_id,
				grade_status: 'skip',
				operational_date: analysisData.ride.operational_date,
				reason: 'NO_VEHICLE_EVENTS',
				remarks: null,
				ride_id: analysisData.ride._id,
				stops_covered_absolute: null,
				stops_covered_percentage: null,
				stops_not_covered_ids: null,
				stops_qty: null,
				updated_at: Dates.now('utc').unix_milliseconds,
			});
		}

		//
		// Evaluate each vehicle event

		const stopsWithVehicleEvents = new Set<string>();
		const stopsWithoutVehicleEvents = new Set<string>(analysisData.hashed_trip.map(pathWaypoint => pathWaypoint.stop_id));

		for (const pathWaypoint of analysisData.hashed_trip) {
			vehicleEventsLoop: for (const vehicleEvent of analysisData.vehicle_events) {
				const distanceInMeters = getDistanceBetweenPositions(
					[pathWaypoint.stop_lon, pathWaypoint.stop_lat],
					[vehicleEvent.longitude, vehicleEvent.latitude],
				);
				if (distanceInMeters <= BUFFER_RADIUS) {
					stopsWithVehicleEvents.add(pathWaypoint.stop_id);
					stopsWithoutVehicleEvents.delete(pathWaypoint.stop_id);
					break vehicleEventsLoop;
				}
			}
		}

		//
		// Calculate coverage metrics

		const stopsCoveragePercentage = stopsWithVehicleEvents.size / analysisData.hashed_trip.length * 100;

		//
		// Return the result

		if (stopsCoveragePercentage < 90) {
			return RideAnalysisExpectedVehicleEventCoverageGeoSchema.parse({
				agency_id: analysisData.ride.agency_id,
				grade_status: 'fail',
				operational_date: analysisData.ride.operational_date,
				reason: 'LESS_THAN_90_PCT_COVERAGE',
				remarks: null,
				ride_id: analysisData.ride._id,
				stops_covered_absolute: stopsWithVehicleEvents.size,
				stops_covered_percentage: stopsCoveragePercentage,
				stops_not_covered_ids: Array.from(stopsWithoutVehicleEvents.values()),
				stops_qty: analysisData.hashed_trip.length,
				updated_at: Dates.now('utc').unix_milliseconds,
			});
		}

		return RideAnalysisExpectedVehicleEventCoverageGeoSchema.parse({
			agency_id: analysisData.ride.agency_id,
			grade_status: 'pass',
			operational_date: analysisData.ride.operational_date,
			reason: '90_PCT_OR_MORE_COVERAGE',
			remarks: null,
			ride_id: analysisData.ride._id,
			stops_covered_absolute: stopsWithVehicleEvents.size,
			stops_covered_percentage: stopsCoveragePercentage,
			stops_not_covered_ids: Array.from(stopsWithoutVehicleEvents.values()),
			stops_qty: analysisData.hashed_trip.length,
			updated_at: Dates.now('utc').unix_milliseconds,
		});

		//
	} catch (error) {
		return RideAnalysisExpectedVehicleEventCoverageGeoSchema.parse({
			agency_id: analysisData.ride.agency_id,
			grade_status: 'error',
			operational_date: analysisData.ride.operational_date,
			reason: null,
			remarks: error.message,
			ride_id: analysisData.ride._id,
			stops_covered_absolute: null,
			stops_covered_percentage: null,
			stops_not_covered_ids: null,
			stops_qty: null,
			updated_at: Dates.now('utc').unix_milliseconds,
		});
	}
};
