'use client';

import Button from '@/components/common/Button';
import DeleteButton from '@/components/common/DeleteButton';
import { useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { Surface } from '@/components/layout/Surface';
import { MultiSelect, Select } from '@mantine/core';
import { useEffect, useMemo } from 'react';

import styles from './styles.module.css';

export default function AlertReferencesStops() {
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
				references.map((_, index) => <AlertReferencesStopsItem index={index} key={index} />)
			)}
			<Button
				className={styles.button}
				label="Adicionar Paragem"
				onClick={handleAddReference}
				variant="primary"
			/>
		</div>
	);
}

function AlertReferencesStopsItem({ index }: { index: number }) {
	// Access context data and actions
	const { actions, data } = useAlertDetailContext();
	const { form, routes, stops } = data;

	const reference = form.values.references[index];
	const { municipality_ids } = form.values;

	// Memoized data transformations
	const availableStops = useMemo(() => {
		if (!stops || !municipality_ids) return [];
		return stops
			.filter(stop => municipality_ids.includes(stop.municipality_id))
			.map(stop => ({
				label: `[${stop.id}] ${stop.long_name}`,
				value: stop.id,
			}));
	}, [stops, municipality_ids]);

	const availableRoutes = useMemo(() => {
		if (!routes || !reference.parent_id) return [];
		const selectedStop = stops.find(stop => stop.id === reference.parent_id);
		return selectedStop?.route_ids.map((routeId) => {
			const route = routes.find(route => route.id === routeId);
			return {
				label: `[${routeId}] ${route?.long_name}`,
				value: routeId,
			};
		}) ?? [];
	}, [stops, routes, reference.parent_id]);

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
				<DeleteButton onClick={handleRemoveReference} />
				<div>Paragem Afetada</div>
			</div>
			<div className={styles.body}>
				<Select
					data={availableStops}
					label="Paragem"
					limit={100}
					placeholder="Selecione a paragem"
					variant="default"
					{...form.getInputProps(`references.${index}.parent_id`)}
				/>
				<MultiSelect
					data={availableRoutes}
					label="Paragens Afetadas"
					nothingFoundMessage="Nenhuma rota encontrada, selecione uma paragem"
					placeholder="Selecione as rotas afetadas"
					{...form.getInputProps(`references.${index}.child_ids`)}
				/>
			</div>
		</Surface>
	);
}
