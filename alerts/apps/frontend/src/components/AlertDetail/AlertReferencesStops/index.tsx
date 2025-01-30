"use client";

import { Button, Combobox, Surface } from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import { IconCornerDownRight, IconPlus, IconTrash } from '@tabler/icons-react';
import { useLinesContext } from '@/contexts/Lines.context';
import { useMemo } from 'react';
import { useStopsContext } from '@/contexts/Stops.context';
import { useAlertDetailContext } from '@/contexts/AlertDetail.context';

export default function AlertReferencesStops() {
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
					<AlertReferencesStopsItem index={index} key={index} />
				))
			)}
			<Button className={styles.button} onClick={alertDetailContext.actions.addReference} variant="primary">
				<IconPlus size={18} />
				<div>Adicionar Paragem</div>
			</Button>
		</div>
	);
}


function AlertReferencesStopsItem({ index }: { index: number }) {
	//
	// A. Setup variables
	const { data: linesData } = useLinesContext();
	const { data: stopsData } = useStopsContext();
	const { data: alertDetailsData, actions } = useAlertDetailContext();

	const availableStops = useMemo(() => {
		if (!stopsData.stops) return [];
		if (!alertDetailsData.form.values.municipality_ids) return [];

		return stopsData.stops.filter(stop => alertDetailsData.form.values.municipality_ids.includes(stop.municipality_id)).map(stop => ({
			label: `[${stop.id}] ${stop.long_name}`,
			value: stop.id,
		}));
	}, [stopsData.stops, alertDetailsData.form.values.municipality_ids]);

	const availableRoutes = useMemo(() => {
		if (!linesData.routes) return [];
		if (!alertDetailsData.form.values.references[index].parent_id) return [];

		const selectedStop = stopsData.stops.find(stop => stop.id === alertDetailsData.form.values.references[index].parent_id);
		return selectedStop?.route_ids.map(routeId => ({
			label: `[${routeId}] ${linesData.routes.find(route => route.id === routeId)?.long_name}`,
			value: routeId,
		})) || [];
	}, [linesData.routes, alertDetailsData.form.values.municipality_ids, alertDetailsData.form.values.references[index].parent_id]);


	return (
		<Surface padding="sm" gap="md" borderRadius="sm" classNames={styles}>
			<Combobox
				label="Paragem Afetada"
				data={availableStops}
				aria-label="Paragem Afetada"
				fullWidth
				searchable
				clearable

				{...alertDetailsData.form.getInputProps(`references.${index}.parent_id`)}
			/>
			<div className={styles.childrenWrapper}>
				<IconCornerDownRight size={28} className={styles.icon} />
				<div className={styles.comboboxWrapper}>
					<Combobox
						label="Rotas Afetadas"
						description="Selecione as linhas que serão afetadas pelo alerta"
						data={availableRoutes}
						multiple
						searchable
						clearable
						fullWidth
						aria-label="Linhas Afetadas"
						{...alertDetailsData.form.getInputProps(`references.${index}.child_ids`)}
					/>
				</div>
			</div>
			<div className={styles.buttonContainer}>
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
