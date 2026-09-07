import { type RoutePlannerLocation } from '@/types/route-planner/models';
import { type HubAlert, type HubLine, type HubStop } from '@tmlmobilidade/go-types-hub';

export type SearchResult = { entity: HubAlert, id: string, label: string, score: number, type: 'alert' } | { entity: HubLine, id: string, label: string, score: number, type: 'line' } | { entity: HubStop, id: string, label: string, score: number, type: 'stop' } | { entity: RoutePlannerLocation, id: string, label: string, score: number, type: 'poi' };

export interface SearchGroup {
	key: SearchResult['type']
	results: SearchResult[]
}
