/* * */

import { AgencyDisplay } from '@/components/common/AgencyDisplay';
import { useValidationsDetailContext } from '@/components/gtfs-validations/detail/ValidationsDetailForm.context';
import { Collapsible, Section } from '@tmlmobilidade/ui';

/* * */

export function ValidationsDetailSectionAgency() {
	//

	//
	// A. Setup variables

	const validationsDetailContext = useValidationsDetailContext();

	//
	// B. Render components

	if (!validationsDetailContext.data.validation?.gtfs_agency) {
		return null;
	}

	return (
		<Collapsible
			description="Resumo dos dados do operador extraídos do ficheiro agency.txt"
			title="Dados do Operador"
		>
			<Section gap="sm">
				<AgencyDisplay data={validationsDetailContext.data.validation.gtfs_agency} />
			</Section>
		</Collapsible>
	);

	//
}
