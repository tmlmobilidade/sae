import { type MotisGeocodeArea, type MotisGeocodeResult, type MotisPlanLeg, type RoutePlannerLocation } from '@/types/route-planner/models';

/* * */

export function formatDateTimeLocalInputValue(date: Date) {
	const offset = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - offset * 60_000);
	return localDate.toISOString().slice(0, 16);
}

export function formatMotisLocationDetail(location: MotisGeocodeResult | RoutePlannerLocation) {
	const label = 'label' in location ? location.label : location.name;
	const street = [
		getUsefulLocationPart(location.street),
		getUsefulLocationPart(location.houseNumber),
	].filter(Boolean).join(' ');
	const areaNames = getMotisAreaNames(location.areas, [label, street]);
	const locality = [getUsefulLocationPart(location.zip), ...areaNames].filter(Boolean).join(' ');

	return [street, locality].filter(Boolean).join(' · ');
}

export function formatMotisPlanDuration(seconds: number | undefined) {
	if (!Number.isFinite(seconds)) return null;

	const minutes = Math.round((seconds || 0) / 60);
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes} min`;
}

export function getDurationMinutes(seconds: number | undefined) {
	if (!Number.isFinite(seconds)) return null;
	return Math.max(0, Math.round((seconds || 0) / 60));
}

export function formatMotisPlanDistance(meters: number | undefined) {
	if (!Number.isFinite(meters)) return null;

	const normalizedMeters = Math.max(0, meters || 0);
	const useKilometers = normalizedMeters >= 1000;

	return new Intl.NumberFormat(undefined, {
		maximumFractionDigits: useKilometers ? 1 : 0,
		style: 'unit',
		unit: useKilometers ? 'kilometer' : 'meter',
		unitDisplay: 'short',
	}).format(useKilometers ? normalizedMeters / 1000 : normalizedMeters);
}

export function formatMotisPlanTime(value: number | string | undefined) {
	if (!value) return '--:--';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '--:--';

	return new Intl.DateTimeFormat(undefined, {
		hour: '2-digit',
		hour12: false,
		minute: '2-digit',
	}).format(date);
}

export function getMotisLegDetail(leg: MotisPlanLeg, fallbackOrigin: string, fallbackDestination: string) {
	const from = leg.from.name || fallbackOrigin;
	const to = leg.to.name || fallbackDestination;
	const start = formatMotisPlanTime(leg.startTime);
	const end = formatMotisPlanTime(leg.endTime);

	return `${start} -> ${end} | ${from} -> ${to}`;
}

/* * */

function getMotisAreaNames(areas: MotisGeocodeArea[] | undefined, excludedValues: Array<string | undefined>) {
	const excluded = new Set(excludedValues.map(normalizeLocationPart).filter(Boolean));
	const result: string[] = [];
	const seen = new Set<string>();

	for (const area of areas ?? []) {
		const name = getUsefulLocationPart(area.name);
		const normalizedName = normalizeLocationPart(name);
		if (!name || !normalizedName || excluded.has(normalizedName) || seen.has(normalizedName)) continue;

		seen.add(normalizedName);
		result.push(name);
		if (result.length === 2) break;
	}

	return result;
}

function getUsefulLocationPart(value: string | undefined) {
	const normalizedValue = normalizeLocationPart(value);
	if (!normalizedValue || ['address', 'none', 'null', 'place', 'stop', 'undefined'].includes(normalizedValue)) return '';
	return value?.trim() ?? '';
}

function normalizeLocationPart(value: string | undefined) {
	return value?.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase().trim() ?? '';
}
