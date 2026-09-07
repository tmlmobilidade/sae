/* * */

import { type HubAlert } from '@tmlmobilidade/go-types-hub';

/* * */

export type AlertSeverityLevel = 'high' | 'info' | 'low' | 'medium';
const EFFECT_SEVERITY: Record<HubAlert['effect'], AlertSeverityLevel> = {
	ACCESSIBILITY_ISSUE: 'low',
	ADDITIONAL_SERVICE: 'info',
	DETOUR: 'medium',
	MODIFIED_SERVICE: 'low',
	NO_EFFECT: 'info',
	NO_SERVICE: 'high',
	OTHER_EFFECT: 'info',
	REDUCED_SERVICE: 'low',
	SIGNIFICANT_DELAYS: 'high',
	STOP_MOVED: 'low',
	UNKNOWN_EFFECT: 'info',
};

/* * */

export function getEffectSeverityLevel(effect: HubAlert['effect']): AlertSeverityLevel {
	return EFFECT_SEVERITY[effect];
}
