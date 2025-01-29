/* * */

import type { ApexT11, ApexT19, HashedShape, HashedTrip, Ride, VehicleEvent } from '@tmlmobilidade/core/types';

/* * */

export interface AnalysisData {
	apex_t11: ApexT11[]
	apex_t19: ApexT19[]
	hashed_shape: HashedShape
	hashed_trip: HashedTrip
	ride: Ride
	vehicle_events: VehicleEvent[]
}
