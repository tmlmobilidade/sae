/* * */

import { alertsIndexes, plansIndexes, rideAcceptancesIndexes, ridesIndexes, vehiclesIndexes } from '@/indexes/index.js';
import { type Db, type MongoClient } from '@tmlmobilidade/go-clients-mongo';
import { type Alert, AlertSchema, type GtfsValidation, GtfsValidationSchema, type Plan, PlanSchema, type RideAcceptance, RideAcceptanceSchema, type RideWithAnalyses, RideWithAnalysesSchema, type Sam, SamSchema, type Vehicle, vehicleSchema } from '@tmlmobilidade/go-types-operation';

import { createGoDbCollection } from '../factory/create-godb-collection.js';
import { type GoDbCollection } from '../factory/types/godb-collection.type.js';

/* * */

export class OperationDatabase {
	//

	public readonly alerts: GoDbCollection<Alert>;
	public readonly gtfsValidations: GoDbCollection<GtfsValidation>;
	public readonly plans: GoDbCollection<Plan>;
	public readonly rideAcceptances: GoDbCollection<RideAcceptance>;
	public readonly rides: GoDbCollection<RideWithAnalyses>;
	public readonly sams: GoDbCollection<Sam>;
	public readonly vehicles: GoDbCollection<Vehicle>;

	private readonly database: Db;
	private readonly databaseName = 'operation';

	public constructor(instance: MongoClient) {
		// Create the database instance
		this.database = instance.db(this.databaseName);
		// Create collection interfaces
		this.alerts = createGoDbCollection<Alert>({ collectionName: 'alerts', database: this.database, indexDescription: alertsIndexes, schema: AlertSchema });
		this.gtfsValidations = createGoDbCollection<GtfsValidation>({ collectionName: 'gtfs-validations', database: this.database, indexDescription: null, schema: GtfsValidationSchema });
		this.plans = createGoDbCollection<Plan>({ collectionName: 'plans', database: this.database, indexDescription: plansIndexes, schema: PlanSchema });
		this.rideAcceptances = createGoDbCollection<RideAcceptance>({ collectionName: 'ride-acceptances', database: this.database, indexDescription: rideAcceptancesIndexes, schema: RideAcceptanceSchema });
		this.sams = createGoDbCollection<Sam>({ collectionName: 'sams', database: this.database, indexDescription: null, schema: SamSchema });
		this.vehicles = createGoDbCollection<Vehicle>({ collectionName: 'vehicles', database: this.database, indexDescription: vehiclesIndexes, schema: vehicleSchema });
		this.rides = createGoDbCollection<RideWithAnalyses>({ collectionName: 'rides', database: this.database, indexDescription: ridesIndexes, schema: RideWithAnalysesSchema });
	}
}
