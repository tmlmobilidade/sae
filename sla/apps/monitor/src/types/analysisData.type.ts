/* * */

import type { ApexT3, ApexT11, ApexT19, HashedShape, HashedTrip, Ride, VehicleEvent } from '@tmlmobilidade/services/types';

/* * */

export interface AnalysisData {
	hashed_shape: HashedShape
	hashed_trip: HashedTrip
	location_transactions: ApexT19[]
	ride: Ride
	sales: ApexT3[]
	validation_transactions: ApexT11[]
	vehicle_events: VehicleEvent[]
}
