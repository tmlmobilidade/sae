import { type TimeSlot } from '@tmlmobilidade/go-types-shared';

export const AppConfig = Object.freeze({
	historicalDataDaysBack: 30,
	interval: '15m' as TimeSlot,
	pipelineSteps: {
		cleanupCurrentRides: true,
		cleanupCurrentVehicleEvents: true,
		cleanupCurrentWaypoints: true,
		cleanupHistoricalNodeTravelTimes: true,
		cleanupHistoricalNodeTravelTimesAggregation: true,
		cleanupHistoricalRides: true,
		cleanupHistoricalShapes: true,
		cleanupHistoricalVehicleEvents: true,
	},
	windowHoursBefore: 1,
});
