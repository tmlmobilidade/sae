import { type BaseMapOperatorId } from '@/types/common/map';
import { isBaseMapAgencyVisible } from '@/utils/map/base-map-operators';
import { getRoutePlannerRouteDirectionKey } from '@/utils/route-planner/itinerary/vehicles';

/* * */

interface BaseMapAlert {
	_id: string
	agency_id: string
}

interface BaseMapVehicleProperties {
	agency_id?: null | string
	direction_id?: null | number | string
	route_id?: null | string
	shape_id?: null | string
	vehicle_id?: null | string
}

interface GetBaseMapAlertsMapDataParams {
	alerts: BaseMapAlert[]
	alertsData: GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>
	excludedOperatorIds: BaseMapOperatorId[]
	focusedAlertId: null | string
	routePlannerAlertsData: GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>
}

interface GetBaseMapVehiclesMapDataParams<TProperties extends BaseMapVehicleProperties> {
	excludedOperatorIds: BaseMapOperatorId[]
	focusedVehicleId: null | string
	lineDetailShapeIds: null | Set<string>
	routePlannerRouteDirections: null | Set<string>
	vehiclesData: GeoJSON.FeatureCollection<GeoJSON.Point, TProperties>
}

/* * */

function getAlertFeatureId(feature: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>) {
	return feature.properties?.id ?? feature.properties?._id;
}

/* * */

export function getBaseMapAlertsMapData(params: GetBaseMapAlertsMapDataParams) {
	const selectedAlertsData = params.focusedAlertId
		? {
			...params.alertsData,
			features: params.alertsData.features.filter(feature => getAlertFeatureId(feature) === params.focusedAlertId),
		}
		: params.routePlannerAlertsData;

	const visibleAlertIds = new Set(
		params.alerts
			.filter(alert => isBaseMapAgencyVisible(alert.agency_id, params.excludedOperatorIds))
			.map(alert => alert._id),
	);

	return {
		...selectedAlertsData,
		features: selectedAlertsData.features.filter((feature) => {
			const featureId = getAlertFeatureId(feature);
			return visibleAlertIds.has(String(featureId));
		}),
	};
}

export function getBaseMapVehiclesMapData<TProperties extends BaseMapVehicleProperties>(params: GetBaseMapVehiclesMapDataParams<TProperties>) {
	const routePlannerVehiclesData = params.routePlannerRouteDirections
		? {
			...params.vehiclesData,
			features: params.vehiclesData.features.filter((feature) => {
				const vehicle = feature.properties;
				const routeDirection = getRoutePlannerRouteDirectionKey(vehicle?.route_id, vehicle?.direction_id, vehicle?.agency_id);
				return routeDirection !== null && params.routePlannerRouteDirections?.has(routeDirection);
			}),
		}
		: params.vehiclesData;

	const lineDetailVehiclesData = params.lineDetailShapeIds
		? {
			...params.vehiclesData,
			features: params.vehiclesData.features.filter((feature) => {
				const shapeId = feature.properties?.shape_id;
				return typeof shapeId === 'string' && params.lineDetailShapeIds?.has(shapeId);
			}),
		}
		: routePlannerVehiclesData;

	const focusedVehiclesData = params.focusedVehicleId
		? {
			...params.vehiclesData,
			features: params.vehiclesData.features.filter(feature => feature.properties?.vehicle_id === params.focusedVehicleId),
		}
		: lineDetailVehiclesData;

	return {
		...focusedVehiclesData,
		features: focusedVehiclesData.features.filter((feature) => {
			return isBaseMapAgencyVisible(feature.properties?.agency_id ?? '', params.excludedOperatorIds);
		}),
	};
}
