"use client";

import { Button, Combobox, Surface } from '@tmlmobilidade/ui';
import styles from './styles.module.css';
import { IconCornerDownRight, IconPlus, IconTrash } from '@tabler/icons-react';
import { useLinesContext } from '@/contexts/Lines.context';
import { useMemo } from 'react';
import { useStopsContext } from '@/contexts/Stops.context';
import { useAlertDetailContext } from '@/contexts/AlertDetail.context';

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
				<Surface padding="md">Não há referências disponíveis.</Surface>
			) : (
				references.map((reference, index) => (
					<AlertReferencesRoutesItem index={index} key={index} />
				))
			)}
			<Button className={styles.button} onClick={alertDetailContext.actions.addReference} variant="primary">
				<IconPlus size={18} />
				<div>Adicionar Rota</div>
			</Button>
		</div>
	);
}


function AlertReferencesRoutesItem({ index }: { index: number }) {
	//
	// A. Setup variables
	const { data: linesData } = useLinesContext();
	const { data: stopsData } = useStopsContext();
	const { data: alertDetailsData, actions } = useAlertDetailContext();

	const availableRoutes = useMemo(() => {
		if (!linesData.routes) return [];


		if (alertDetailsData.form.values.municipality_ids.length === 0) return linesData.routes.map(route => ({
			label: `[${route.id}] ${route.long_name}`,
			value: route.id,
		}));

		return linesData.routes.filter(route => route.municipality_ids.some((municipality: string) => alertDetailsData.form.values.municipality_ids.includes(municipality))).map(route => ({
			label: `[${route.id}] ${route.long_name}`,
			value: route.id,
		}));
	}, [linesData.routes, alertDetailsData.form.values.municipality_ids]);

	const availableStops = useMemo(() => {
		if (!stopsData.stops) return [];
		if (!alertDetailsData.form.values.references[index].parent_id) return [];

		return stopsData.stops.filter(stop => stop.route_ids.includes(alertDetailsData.form.values.references[index].parent_id)).map(stop => ({
			label: `[${stop.id}] ${stop.long_name}`,
			value: stop.id,
		}));
	}, [stopsData.stops, alertDetailsData.form.values.references[index].parent_id]);


	return (
		<Surface padding="sm" gap="md" borderRadius="sm" classNames={styles}>
			<Combobox
				label="Linha Afetada"
				data={availableRoutes}
				aria-label="Linha Afetada"
				fullWidth
				searchable
				clearable

				{...alertDetailsData.form.getInputProps(`references.${index}.parent_id`)}
			/>
			<div className={styles.childrenWrapper}>
				<IconCornerDownRight size={28} className={styles.icon} />
				<Combobox
					label="Paragens Afetadas"
					description="Selecione as paragens que serão afetadas pelo alerta"
					data={availableStops}
					multiple
					searchable
					clearable
					fullWidth
					aria-label="Paragens Afetadas"
					{...alertDetailsData.form.getInputProps(`references.${index}.child_ids`)}
				/>
			</div>
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
