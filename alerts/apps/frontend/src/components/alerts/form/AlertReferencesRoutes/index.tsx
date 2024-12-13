'use client';

import Button from '@/components/common/Button';
import DeleteButton from '@/components/common/DeleteButton';
import { useAlertDetailContext } from '@/components/context/AlertDetail.context';
import { Surface } from '@/components/layout/Surface';
import { MultiSelect, Select } from '@mantine/core';
import { useMemo } from 'react';

import styles from './styles.module.css';

export default function AlertReferencesRoutes() {
	//
	// A. Get Data
	const alertDetailContext = useAlertDetailContext();

	const references = useMemo(() => alertDetailContext.data.form.values.references, [alertDetailContext.data.form.values.references]);

	//
	// C. Render Components
	return (
		<div className={styles.container}>
			{references.length === 0 ? (
				<Surface className={styles.empty} padding="md">Não há referências disponíveis.</Surface>
			) : (
				references.map((reference, index) => (
					<AlertReferencesRoutesItem index={index} key={index} />
				))
			)}
			<Button className={styles.button} label="Adicionar rota" onClick={alertDetailContext.actions.addReference} variant="primary" />
		</div>
	);
}

function AlertReferencesRoutesItem({ index }: { index: number }) {
	//
	// A. Get Data
	const alertDetailContext = useAlertDetailContext();

	//
	// B. Transform Data
	const availableRoutes = useMemo(() => {
		if (!alertDetailContext.data.routes || !alertDetailContext.data.form.values.municipality_ids) return [];

		return alertDetailContext.data.routes.filter(route => route.municipality_ids.some((municipality: string) => alertDetailContext.data.form.values.municipality_ids.includes(municipality))).map(route => ({
			label: `[${route.id}] ${route.long_name}`,
			value: route.id,
		}));
	}, [alertDetailContext.data.routes, alertDetailContext.data.form.values.municipality_ids]);

	const availableStops = useMemo(() => {
		if (!alertDetailContext.data.stops) return [];
		if (!alertDetailContext.data.form.values.references[index].parent_id) return [];

		return alertDetailContext.data.stops.filter(stop => stop.route_ids.includes(alertDetailContext.data.form.values.references[index].parent_id)).map(stop => ({
			label: `[${stop.id}] ${stop.long_name}`,
			value: stop.id,
		}));
	}, [alertDetailContext.data.stops, alertDetailContext.data.form.values.references[index].parent_id]);

	//
	// C. Render Components
	return (
		<Surface className={styles.itemSurface}>
			<div className={styles.header}>
				<DeleteButton onClick={() => alertDetailContext.actions.removeReference(index)} />
				<div>Rota Afetada</div>
			</div>
			<div className={styles.body}>
				<Select
					data={availableRoutes}
					nothingFoundMessage="Nenhuma linha encontrada"
					placeholder="Selecione a linha"
					{...alertDetailContext.data.form.getInputProps(`references.${index}.parent_id`)}
				/>
				<MultiSelect
					data={availableStops}
					label="Paragens Afetadas"
					nothingFoundMessage="Nenhuma paragem encontrada, selecione uma rota"
					placeholder="Selecione as paragens afetadas"
					{...alertDetailContext.data.form.getInputProps(`references.${index}.child_ids`)}
				/>
			</div>
		</Surface>
	);
}
