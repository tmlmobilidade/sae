import type { Area as MotisApiArea, GeocodeResponse as MotisApiGeocodeResponse, Itinerary as MotisApiItinerary, Leg as MotisApiLeg, Place as MotisApiPlace, PlanResponse as MotisApiPlanResponse } from '@/types/motis-api';

/* * */

export type RoutePlannerTravelTimeMode = 'arrival' | 'departure' | 'now';
export type RoutePlannerLocationSearchTarget = 'destination' | 'origin';
export type RoutePlannerPlanViewMode = 'place-detail' | 'results';
export type RoutePlannerLocationSearchReturnView = RoutePlannerPlanViewMode;
export type RoutePlannerViewMode = 'destination-search' | 'itinerary-detail' | RoutePlannerPlanViewMode;

export type MotisLegModeKind = 'bike' | 'bus' | 'car' | 'elevator' | 'ferry' | 'plane' | 'rail' | 'scooter' | 'subway' | 'tram' | 'transit' | 'walk';

export type MotisGeocodeArea = Partial<MotisApiArea>;

export type MotisGeocodeResult = MotisApiGeocodeResponse[number];

export interface RoutePlannerLocation {
	areas?: MotisGeocodeArea[]
	category?: string
	country?: string
	detail: string
	houseNumber?: string
	id?: string
	label: string
	lat?: number
	level?: number
	lon?: number
	modes?: string[]
	street?: string
	type: string
	zip?: string
}

export type MotisPlanPlace = MotisApiPlace;
export type MotisPlanIntermediateStop = MotisApiPlace;
export type MotisPlanLeg = MotisApiLeg;
export type MotisItinerary = MotisApiItinerary;
export type MotisPlanResponse = MotisApiPlanResponse;

export interface RoutePlannerTravelTime {
	date: Date
	mode: RoutePlannerTravelTimeMode
}

export interface RoutePlannerItineraryMapData {
	shapeData: GeoJSON.FeatureCollection<GeoJSON.LineString>
	waypointsData: GeoJSON.FeatureCollection<GeoJSON.Point>
}

export interface RoutePlannerItineraryMapDataOptions {
	lineStyleByShortName?: Map<string, { color?: string, text_color?: string }>
}
