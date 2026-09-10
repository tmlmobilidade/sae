/* * */

import { TimeSlot, UnixMilliseconds } from '@tmlmobilidade/go-types-shared';

/* * */

export interface AppConfig {
	agencyIds: string[]
	database: string
	processing: {
		// Current rides Time Range
		currentRidesEndTime: UnixMilliseconds
		currentRidesStartTime: UnixMilliseconds

		/** Geohash prefix length used to restrict candidate events to cells near a stop. A length of 6 matches a geohash-7 cell and its neighbours (~1.2 km). */
		geohashPrefixLength: number

		// Historical rides Time Range
		historicalRidesEndTime: UnixMilliseconds
		historicalRidesStartTime: UnixMilliseconds

		/** Length of shape node chunks in meters. */
		shapeNodeChunkLength: number

		/** Geofence radius (meters) around first/last stop used to detect observed start/end times. */
		stopGeofenceRadius: number
	}
	stages: {
		_1_bootstrap: boolean
		_2_loadCurrentRides: boolean
		_3_loadHistoricalRides: boolean
		_4_loadHistoricalShapeNodes: boolean
		_5_loadHistoricalVehicleEvents: boolean
		_6_calculateNodeTravelTimes: boolean
		_7_loadCurrentWaypoints: boolean
	}
	syncInterval: TimeSlot
}
