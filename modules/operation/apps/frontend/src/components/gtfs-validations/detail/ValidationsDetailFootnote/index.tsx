/* * */

import { useValidationsDetailContext } from '@/components/gtfs-validations/detail/ValidationsDetailForm.context';
import { Dates } from '@tmlmobilidade/dates';
import { Label, Section, UserTag } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

/* * */

export function ValidationsDetailFootnote() {
	//

	//
	// A. Setup variables

	const validationsDetailContext = useValidationsDetailContext();

	//
	// B. Transform data

	const formattedDateString = useMemo(() => {
		// Skip if no value
		if (!validationsDetailContext.data.validation.created_at) return 'N/A';
		// Convert the Unix timestamp to a Date object.
		return Dates
			.fromUnixMilliseconds(validationsDetailContext.data.validation.created_at)
			.toLocaleString({ day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'long', year: 'numeric' }, 'pt-PT');
	}, [validationsDetailContext.data.validation.created_at]);

	//
	// C. Render components

	return (
		<Section>
			<Label size="sm">Validação criada por <UserTag userId={validationsDetailContext.data.validation.created_by} variant="inline" /> a {formattedDateString}</Label>
			<Label size="sm">As validações são eliminadas automaticamente ao fim de 30 dias após a sua data de criação. Poderão ser eliminadas mais cedo se necessário.</Label>
		</Section>
	);

	//
}
