import { type MotisItinerary, type MotisPlanIntermediateStop, type MotisPlanLeg, type MotisPlanPlace, type RoutePlannerItineraryMapData } from '@/types/route-planner/models';
import { getMotisLegRouteLabel, isMotisWalkingLeg } from '@/utils/route-planner/presentation/modes';
import { type HubAlert, type HubLine } from '@tmlmobilidade/go-types-hub';

/* * */

interface RoutePlannerAlertFilters {
	agencyIds: Set<string>
	lineIds: Set<string>
	stopIds: Set<string>
	tripIds: Set<string>
}

interface RoutePlannerAlertItinerary {
	legs: MotisItinerary['legs']
}

interface MotisStopIdCandidate extends MotisPlanIntermediateStop {
	stopCode?: string
	stopId?: string
}

/* * */

function addStopIdVariant(stopIds: Set<string>, value: string | undefined) {
	if (!value) return;

	stopIds.add(value);

	if (value.startsWith('GTFS_')) {
		stopIds.add(value.slice('GTFS_'.length));
		return;
	}

	stopIds.add(`GTFS_${value}`);
}

function getIntermediateStopIds(stop: MotisPlanIntermediateStop) {
	const candidate = stop as MotisStopIdCandidate;
	return [
		candidate.stopId,
		candidate.stopCode,
	].filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function getMotisLegTripIds(leg: MotisPlanLeg) {
	return typeof leg.tripId === 'string' && leg.tripId.length > 0 ? [leg.tripId] : [];
}

function getMotisPlanPlaceStopId(place: MotisPlanIntermediateStop | MotisPlanPlace | undefined) {
	return place?.stopId || place?.stopCode;
}

function hasAnyMatchingValue(values: string[], selectedValues: Set<string>) {
	return values.some(value => selectedValues.has(value));
}

function getFeatureAlertId(feature: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>) {
	const alertId = feature.properties?.id ?? feature.properties?._id;
	return typeof alertId === 'string' ? alertId : null;
}

function getLineStringMidpoint(feature: GeoJSON.Feature<GeoJSON.LineString>) {
	if (feature.geometry.coordinates.length === 0) return null;
	return feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length / 2)] ?? null;
}

function getAlertMatchingLineIds(alert: HubAlert) {
	const lineIds = new Set<string>();

	if (alert.reference_type === 'lines') {
		alert.references.forEach(reference => lineIds.add(reference.parent_id));
	}

	if (alert.reference_type === 'stops') {
		alert.references.forEach((reference) => {
			reference.child_ids.forEach(childId => lineIds.add(childId));
		});
	}

	return lineIds;
}

function getRoutePlannerAlertCoordinate(alert: HubAlert, routeMapData: RoutePlannerItineraryMapData, lines: HubLine[]) {
	const alertLineIds = getAlertMatchingLineIds(alert);
	const matchingRouteLabels = new Set(
		lines
			.filter((line) => {
				if (alert.reference_type === 'agency') return alert.references.some(reference => reference.parent_id === line.agency_id);
				return alertLineIds.has(line._id);
			})
			.map(line => line.short_name),
	);

	const matchingFeature = routeMapData.shapeData.features.find((feature) => {
		const routeLabel = feature.properties?.route_label;
		return typeof routeLabel === 'string' && matchingRouteLabels.has(routeLabel);
	}) ?? routeMapData.shapeData.features[0];

	if (!matchingFeature) return null;
	return getLineStringMidpoint(matchingFeature);
}

function buildRoutePlannerAlertFeature(alert: HubAlert, coordinates: GeoJSON.Position): GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties> {
	return {
		geometry: {
			coordinates,
			type: 'Point',
		},
		properties: {
			_id: alert._id,
			cause: alert.cause,
			description: alert.description,
			effect: alert.effect,
			id: alert._id,
			title: alert.title,
		},
		type: 'Feature',
	};
}

/* * */

export function getRoutePlannerItineraryAlertFilters(itinerary: null | RoutePlannerAlertItinerary, lines: HubLine[]): null | RoutePlannerAlertFilters {
	if (!itinerary) return null;

	const transitLegs = Array.isArray(itinerary.legs) ? itinerary.legs.filter(leg => !isMotisWalkingLeg(leg)) : [];
	const routeLabels = new Set(
		transitLegs
			.map(leg => getMotisLegRouteLabel(leg))
			.filter((value): value is string => Boolean(value)),
	);

	const matchingLines = lines.filter(line => routeLabels.has(line.short_name));
	const lineIds = new Set(matchingLines.map(line => line._id));
	const agencyIds = new Set(matchingLines.map(line => line.agency_id));
	const stopIds = new Set<string>();
	const tripIds = new Set<string>();

	for (const leg of transitLegs) {
		const fromStopId = getMotisPlanPlaceStopId(leg.from);
		const toStopId = getMotisPlanPlaceStopId(leg.to);
		addStopIdVariant(stopIds, fromStopId);
		addStopIdVariant(stopIds, toStopId);

		const intermediateStops = [
			...(Array.isArray(leg.intermediateStops) ? leg.intermediateStops : []),
		];

		for (const stop of intermediateStops) {
			for (const stopId of getIntermediateStopIds(stop)) {
				addStopIdVariant(stopIds, stopId);
			}
		}

		for (const tripId of getMotisLegTripIds(leg)) {
			tripIds.add(tripId);
		}
	}

	return {
		agencyIds,
		lineIds,
		stopIds,
		tripIds,
	};
}

export function filterAlertsByRoutePlannerItinerary(alerts: HubAlert[], filters: null | RoutePlannerAlertFilters) {
	if (!filters) return alerts;

	return alerts.filter((alert) => {
		if (alert.reference_type === 'agency') {
			return alert.references.some(reference => filters.agencyIds.has(reference.parent_id));
		}

		if (alert.reference_type === 'lines') {
			return alert.references.some((reference) => {
				if (!filters.lineIds.has(reference.parent_id)) return false;
				if (reference.child_ids.length === 0) return true;
				return hasAnyMatchingValue(reference.child_ids, filters.stopIds);
			});
		}

		if (alert.reference_type === 'stops') {
			return alert.references.some((reference) => {
				if (!filters.stopIds.has(reference.parent_id)) return false;
				if (reference.child_ids.length === 0) return true;
				return hasAnyMatchingValue(reference.child_ids, filters.lineIds);
			});
		}

		if (alert.reference_type === 'rides') {
			return alert.references.some(reference => filters.tripIds.has(reference.parent_id));
		}

		return false;
	});
}

export function filterAlertFeatureCollectionByAlertIds(
	alertsData: GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>,
	alertIds: null | Set<string>,
) {
	if (!alertIds) return alertsData;

	return {
		...alertsData,
		features: alertsData.features.filter((feature) => {
			const alertId = getFeatureAlertId(feature);
			return alertId !== null && alertIds.has(alertId);
		}),
	};
}

export function buildRoutePlannerAlertFeatureCollection(
	alertsData: GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>,
	alerts: HubAlert[],
	routeMapData: RoutePlannerItineraryMapData,
	lines: HubLine[],
) {
	const alertIds = new Set(alerts.map(alert => alert._id));
	const collection = filterAlertFeatureCollectionByAlertIds(alertsData, alertIds);
	const featureAlertIds = new Set(collection.features.map(getFeatureAlertId).filter((value): value is string => value !== null));

	for (const alert of alerts) {
		if (featureAlertIds.has(alert._id)) continue;

		const coordinates = getRoutePlannerAlertCoordinate(alert, routeMapData, lines);
		if (!coordinates) continue;

		collection.features.push(buildRoutePlannerAlertFeature(alert, coordinates));
		featureAlertIds.add(alert._id);
	}

	return collection;
}
