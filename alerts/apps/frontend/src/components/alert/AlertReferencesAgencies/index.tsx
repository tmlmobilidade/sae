"use client";

import { Button, Combobox, Surface } from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMemo } from 'react';
import { useAlertDetailContext } from '@/contexts/AlertDetail.context';

export default function AlertReferencesAgencies() {
	//
	// A. Get Data
	const alertDetailContext = useAlertDetailContext();

	const references = useMemo(() => alertDetailContext.data.form.values.references, [alertDetailContext.data.form.values.references]);

	//
	// C. Render Components
	return (
		<div className={styles.container}>
			{references.length === 0 ? (
				<Surface padding="md">Não há referências disponíveis.</Surface>
			) : (
				references.map((reference, index) => (
					<AlertReferencesAgenciesItem index={index} key={index} />
				))
			)}
			<Button className={styles.button} onClick={alertDetailContext.actions.addReference} variant="primary">
				<IconPlus size={18} />
				<div>Adicionar Rota</div>
			</Button>
		</div>
	);
}


function AlertReferencesAgenciesItem({ index }: { index: number }) {
	//
	// A. Setup variables
	const { data: alertDetailsData, actions } = useAlertDetailContext();

	const availableAgencies = useMemo(() => {
		return [{ label: 'Carris Metropolitana', value: 'CM' }];
	}, []);


	return (
		<Surface padding="sm" gap="md" borderRadius="sm" classNames={styles}>
			<Combobox
				label="Agência Afetada"
				data={availableAgencies}
				aria-label="Agência Afetada"
				fullWidth
				searchable
				clearable

				{...alertDetailsData.form.getInputProps(`references.${index}.parent_id`)}
			/>
			<div className={styles.deleteButtonWrapper}>
				<Button
					variant="danger"
					className={styles.button}
					onClick={() => actions.removeReference(index)}
				>
					<IconTrash size={18} />
					<div>Eliminar</div>
				</Button>
			</div>
		</Surface>
	);
}
