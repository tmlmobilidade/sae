import { type BaseMapOperatorId, getAgencyMapOperatorId } from '@/lib/agency-catalog';

/* * */

export const BASE_MAP_OPERATOR_IDS = ['IA9T6', 'IA2N9', 'N18KL', 'LTP61', 'CM', 'A3H3M', '7NTB1', 'KB1F6', 'HF16N'] as const satisfies readonly BaseMapOperatorId[];

/* * */

export function getBaseMapOperatorId(agencyId: string): BaseMapOperatorId | null {
	if (agencyId === 'CM') return 'CM';
	return getAgencyMapOperatorId(agencyId);
}

export function isBaseMapAgencyVisible(agencyId: string, excludedOperatorIds: BaseMapOperatorId[]): boolean {
	const operatorId = getBaseMapOperatorId(agencyId);
	if (!operatorId) return true;

	return !excludedOperatorIds.includes(operatorId);
}
