'use client';

import Button from '@/components/common/Button';
import { useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { Surface } from '@/components/layout/Surface';
import { Select, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useEffect, useMemo } from 'react';

import styles from './styles.module.css';

export default function AlertReferencesAgency() {
	// Access context data and actions
	const { actions, data } = useAlertDetailContext();
	const { references } = data.form.values;

	// Handlers
	const handleAddReference = () => {
		actions.addReference();
	};

	return (
		<div className={styles.container}>
			{references.length === 0 ? (
				<Surface className={styles.empty} padding="md">
					Não há referências disponíveis.
				</Surface>
			) : (
				references.map((_, index) => <AlertReferencesAgencyItem index={index} key={index} />)
			)}
			<Button
				className={styles.button}
				label="Adicionar Agência"
				onClick={handleAddReference}
				variant="primary"
			/>
		</div>
	);
}

function AlertReferencesAgencyItem({ index }: { index: number }) {
	// Access context data and actions
	const { actions, data } = useAlertDetailContext();
	const { form } = data;

	const reference = form.values.references[index];

	// Memoized data transformations
	const availableLiveAgencys = useMemo(() => {
		return [{ label: 'Carris Metropolitana', value: 'CM' }];
	}, []);

	// Clear child routes when parent changes
	useEffect(() => {
		form.setFieldValue(`references.${index}.child_ids`, []);
	}, [reference.parent_id]);

	// Handlers
	const handleRemoveReference = () => {
		actions.removeReference(index);
	};

	return (
		<Surface className={styles.itemSurface}>
			<div className={styles.header}>
				<Tooltip label="Remover Agência">
					<IconTrash className={styles.icon} onClick={handleRemoveReference} />
				</Tooltip>
				<div>Agência Afetada</div>
			</div>
			<div className={styles.body}>
				<Select
					data={availableLiveAgencys}
					label="Agência"
					limit={100}
					placeholder="Selecione a agência"
					variant="default"
					{...form.getInputProps(`references.${index}.parent_id`)}
				/>
			</div>
		</Surface>
	);
}
