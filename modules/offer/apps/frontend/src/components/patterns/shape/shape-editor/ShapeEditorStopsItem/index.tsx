'use client';

/* * */

import { IconArrowBarToDown, IconArrowBarUp, IconClock } from '@tabler/icons-react';
import { PopulatedPath } from '@tmlmobilidade/go-types-offer';
import { DeleteButton, Section, Tag, Text, useLocationsContext } from '@tmlmobilidade/ui';
import { useMemo, useRef, useState } from 'react';

import styles from './styles.module.css';

import { useStopsEditorContext } from '../ShapeEditor.context';

/* * */

export function ShapeEditorStopsItem({ pathItem, rowIndex }: { pathItem: PopulatedPath, rowIndex: number }) {
	//

	//
	// A. Setup variables

	const locationsContext = useLocationsContext();
	const stopsEditorContext = useStopsEditorContext();

	const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const [isExpanded, setIsExpanded] = useState(false);

	const stopItem = stopsEditorContext.data.path[rowIndex];

	const stopLocationInfo = useMemo(() => {
		if (!pathItem.stop) return null;

		const municipalityData = pathItem.stop.municipality_id
			? locationsContext.actions.getMunicipality(pathItem.stop.municipality_id)
			: undefined;

		const localityData = pathItem.stop.locality_id
			? locationsContext.actions.getLocality(pathItem.stop.locality_id)
			: undefined;

		const localityName = localityData?.name;
		const municipalityName = municipalityData?.name;

		if (!localityName && !municipalityName) return null;
		if (localityName && !municipalityName) return localityName;
		if (!localityName && municipalityName) return municipalityName;
		if (localityName === municipalityName) return localityName;

		return `${localityName}, ${municipalityName}`;
	}, [pathItem.stop, locationsContext]);

	//
	// B. Handle actions

	const handleDelete = () => {
		stopsEditorContext.actions.removeStop(rowIndex);
	};

	const handleToogle = (field: 'allow_drop_off' | 'allow_pickup' | 'timepoint') => {
		const currentValue = stopItem ? stopItem[field] : undefined;
		if (currentValue === undefined) return;

		stopsEditorContext.actions.updateStop(rowIndex, { [field]: !currentValue });
	};

	const clearEnterTimeout = () => {
		if (enterTimeoutRef.current) {
			clearTimeout(enterTimeoutRef.current);
			enterTimeoutRef.current = null;
		}
	};

	const clearExitTimeout = () => {
		if (exitTimeoutRef.current) {
			clearTimeout(exitTimeoutRef.current);
			exitTimeoutRef.current = null;
		}
	};

	const handleMouseEnter = () => {
		clearExitTimeout();

		enterTimeoutRef.current = setTimeout(() => {
			setIsExpanded(true);
			enterTimeoutRef.current = null;
		}, 100);
	};

	const handleMouseLeave = () => {
		clearEnterTimeout();

		exitTimeoutRef.current = setTimeout(() => {
			setIsExpanded(false);
			exitTimeoutRef.current = null;
		}, 100);
	};

	//
	// C. Render components

	return (
		<div
			className={`${styles.container} ${isExpanded ? styles.expanded : ''}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<Section gap="md" padding="none">
				<div className={styles.stopInfo}>
					<Text maw="90%" weight="semibold">
						{rowIndex + 1}. {pathItem.stop?.name ?? `Paragem ${pathItem.stop_id}`}
					</Text>

					<div className={styles.details}>
						<div className={styles.detailsInner}>
							<Text c="var(--color-system-text-200)" size="sm">
								{stopLocationInfo ? `${stopLocationInfo} | ` : ''}#{pathItem.stop?._id ?? pathItem.stop_id}
							</Text>

							<Section flexDirection="row" gap="sm" padding="none">
								<Tag icon={<IconClock />} onClick={() => handleToogle('timepoint')} tooltip={`O horário ${stopItem?.timepoint ? 'é' : 'não é'} exato nesta paragem`} variant={stopItem?.timepoint ? 'muted' : 'danger'} />
								<Tag icon={<IconArrowBarToDown />} onClick={() => handleToogle('allow_pickup')} tooltip={`O embarque ${stopItem?.allow_pickup ? 'é' : 'não é'} permitido nesta paragem`} variant={stopItem?.allow_pickup ? 'muted' : 'danger'} />
								<Tag icon={<IconArrowBarUp />} onClick={() => handleToogle('allow_drop_off')} tooltip={`O desembarque ${stopItem?.allow_drop_off ? 'é' : 'não é'} permitido nesta paragem`} variant={stopItem?.allow_drop_off ? 'muted' : 'danger'} />
							</Section>
						</div>
					</div>
				</div>
			</Section>

			{isExpanded && (
				<div className={styles.menuButton}>
					<DeleteButton onDelete={handleDelete} />
				</div>
			)}
		</div>
	);
}
