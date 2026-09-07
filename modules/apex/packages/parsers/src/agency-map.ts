/* * */

const operatorLongIdToAgencyIdMap = new Map<string, string>([
	['1', 'IA9T6'], // CCFL
	['2', 'IA2N9'], // Metro de Lisboa
	['3', 'N18KL'], // Comboios de Portugal
	['4', 'LTP61'], // Transtejo
	['8', 'A3H3M'], // TCB
	['10', 'ZVBA1'], // Scotturb
	['15', '7NTB1'], // Fertagus
	['16', 'KB1F6'], // MTS (Almada)
	['21', 'HF16N'], // MobiCascais
	['23', 'WCEDH'], // Portal Viva
	['41', 'LA77N'], // Viação Alvorada (CM)
	['42', 'BNA17'], // Rodoviária de Lisboa (CM)
	['43', 'YA15B'], // TST (CM)
	['44', 'A2L1N'], // Alsa Todi (CM)
]);

/* * */

export function getAgencyIdFromOperatorLongId(operatorLongId: string): string {
	//

	const foundAgencyId = operatorLongIdToAgencyIdMap.get(operatorLongId);

	if (!foundAgencyId) {
		throw new Error(`Agency ID not found for operator long ID: ${operatorLongId}`);
	}

	return foundAgencyId;
}
