/* * */

import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

const isProduction = process.env.ENVIRONMENT === 'prd';

export const AppConfig = Object.freeze({
	// Agency and line configurations
	agencyIds: ['IA9T6', 'A3H3M', 'HF16N', 'LA77N', 'BNA17', 'YA15B', 'A2L1N'],
	database: 'eta',
	processing: {
		// Current rides Time Range
		currentRidesEndTime: Dates.now('local').plus({ hours: Dates.standardWindowHours }).unix_milliseconds,
		currentRidesStartTime: Dates.now('local').minus({ hours: Dates.standardWindowHours }).unix_milliseconds,

		/** Geohash prefix length used to restrict candidate events to cells near a stop. A length of 6 matches a geohash-7 cell and its neighbours (~1.2 km). */
		geohashPrefixLength: 6,

		// Historical rides Time Range
		historicalRidesEndTime: Dates.now('local').minus({ hours: Dates.standardWindowHours }).unix_milliseconds,
		historicalRidesStartTime: Dates.now('local').minus({ days: 30, hours: Dates.standardWindowHours }).unix_milliseconds,

		/** Length of shape node chunks in meters. */
		shapeNodeChunkLength: 25,

		/** Geofence radius (meters) around first/last stop used to detect observed start/end times. */
		stopGeofenceRadius: 50,
	},
	stages: {
		_1_bootstrap: !isProduction,
		_2_loadCurrentRides: true,
		_3_loadHistoricalRides: true,
		_4_loadHistoricalShapeNodes: true,
		_5_loadHistoricalVehicleEvents: true,
		_6_calculateNodeTravelTimes: true,
		_7_loadCurrentWaypoints: true,
	},
	syncInterval: '15m',
});
