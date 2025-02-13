'use client';

import { useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { useLinesContext } from '@/contexts/Lines.context';
import { useStopsContext } from '@/contexts/Stops.context';
import { IconCornerDownRight, IconPlus, IconTrash } from '@tabler/icons-react';
import { Button, Combobox, Surface } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

import styles from './styles.module.css';

export default function AlertReferencesRoutes() {
	//
	// A. Get Data
	const alertDetailContext = useAlertDetailContext();

	const references = useMemo(
		() => alertDetailContext.data.form.values.references,
		[alertDetailContext.data.form.values.references],
	);

	//
	// C. Render Components
	return (
		<div className={styles.container}>
			{references.length === 0 ? (
				<Surface padding="md">Não há referências disponíveis.</Surface>
			) : (
				references.map((reference, index) => (
					<AlertReferencesRoutesItem key={index} index={index} />
				))
			)}
			<Button
				className={styles.button}
				icon={<IconPlus size={18} />}
				label="Adicionar Rota"
				onClick={alertDetailContext.actions.addReference}
				variant="primary"
			/>
		</div>
	);
}

function AlertReferencesRoutesItem({ index }: { index: number }) {
	//
	// A. Setup variables
	const { data: linesData } = useLinesContext();
	const { data: stopsData } = useStopsContext();
	const { actions, data: alertDetailsData } = useAlertDetailContext();

	const availableRoutes = useMemo(() => {
		if (!linesData.routes) return [];

		if (alertDetailsData.form.values.municipality_ids.length === 0)
			return linesData.routes.map(route => ({
				label: `[${route.id}] ${route.long_name}`,
				value: route.id,
			}));

		return linesData.routes
			.filter(route =>
				route.municipality_ids.some((municipality: string) =>
					alertDetailsData.form.values.municipality_ids.includes(
						municipality,
					),
				),
			)
			.map(route => ({
				label: `[${route.id}] ${route.long_name}`,
				value: route.id,
			}));
	}, [linesData.routes, alertDetailsData.form.values.municipality_ids]);

	const availableStops = useMemo(() => {
		if (!stopsData.stops) return [];
		if (!alertDetailsData.form.values.references[index].parent_id)
			return [];

		return stopsData.stops
			.filter(stop =>
				stop.route_ids.includes(
					alertDetailsData.form.values.references[index].parent_id,
				),
			)
			.map(stop => ({
				label: `[${stop.id}] ${stop.long_name}`,
				value: stop.id,
			}));
	}, [
		stopsData.stops,
		alertDetailsData.form.values.references[index].parent_id,
	]);

	return (
		<Surface borderRadius="sm" classNames={styles} gap="md" padding="sm">
			<Combobox
				aria-label="Linha Afetada"
				data={availableRoutes}
				label="Linha Afetada"
				clearable
				fullWidth
				searchable
				{...alertDetailsData.form.getInputProps(
					`references.${index}.parent_id`,
				)}
			/>
			<div className={styles.childrenWrapper}>
				<IconCornerDownRight className={styles.icon} size={28} />
				<Combobox
					aria-label="Paragens Afetadas"
					data={availableStops}
					description="Selecione as paragens que serão afetadas pelo alerta"
					label="Paragens Afetadas"
					clearable
					fullWidth
					multiple
					searchable
					{...alertDetailsData.form.getInputProps(
						`references.${index}.child_ids`,
					)}
				/>
			</div>
			<div className={styles.deleteButtonWrapper}>
				<Button
					className={styles.button}
					icon={<IconTrash size={18} />}
					label="Eliminar"
					onClick={() => actions.removeReference(index)}
					variant="danger"
				/>
			</div>
		</Surface>
	);
}
