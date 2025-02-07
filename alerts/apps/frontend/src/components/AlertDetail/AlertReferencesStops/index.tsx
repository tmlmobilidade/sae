'use client';

import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { useLinesContext } from '@/contexts/Lines.context';
import { useStopsContext } from '@/contexts/Stops.context';
import { IconCornerDownRight, IconPlus, IconTrash } from '@tabler/icons-react';
import { Button, Combobox, Surface } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

import styles from './styles.module.css';

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
					<AlertReferencesStopsItem key={index} index={index} />
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
	const { actions, data: alertDetailsData } = useAlertDetailContext();

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
		<Surface borderRadius="sm" classNames={styles} gap="md" padding="sm">
			<Combobox
				aria-label="Paragem Afetada"
				data={availableStops}
				label="Paragem Afetada"
				clearable
				fullWidth
				searchable

				{...alertDetailsData.form.getInputProps(`references.${index}.parent_id`)}
			/>
			<div className={styles.childrenWrapper}>
				<IconCornerDownRight className={styles.icon} size={28} />
				<div className={styles.comboboxWrapper}>
					<Combobox
						aria-label="Linhas Afetadas"
						data={availableRoutes}
						description="Selecione as linhas que serão afetadas pelo alerta"
						label="Rotas Afetadas"
						clearable
						fullWidth
						multiple
						searchable
						{...alertDetailsData.form.getInputProps(`references.${index}.child_ids`)}
					/>
				</div>
			</div>
			<div className={styles.buttonContainer}>
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
