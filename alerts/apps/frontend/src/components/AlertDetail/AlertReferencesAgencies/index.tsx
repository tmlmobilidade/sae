'use client';

import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Button, Combobox, Surface } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

import styles from './styles.module.css';

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
					<AlertReferencesAgenciesItem key={index} index={index} />
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
	const { actions, data: alertDetailsData } = useAlertDetailContext();

	const availableAgencies = useMemo(() => {
		return [{ label: 'Carris Metropolitana', value: 'CM' }];
	}, []);

	return (
		<Surface borderRadius="sm" classNames={styles} gap="md" padding="sm">
			<Combobox
				aria-label="Agência Afetada"
				data={availableAgencies}
				label="Agência Afetada"
				clearable
				fullWidth
				searchable

				{...alertDetailsData.form.getInputProps(`references.${index}.parent_id`)}
			/>
			<div className={styles.deleteButtonWrapper}>
				<Button
					className={styles.button}
					onClick={() => actions.removeReference(index)}
					variant="danger"
				>
					<IconTrash size={18} />
					<div>Eliminar</div>
				</Button>
			</div>
		</Surface>
	);
}
