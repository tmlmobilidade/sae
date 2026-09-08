'use client';

/* * */

import { type Stop } from '@tmlmobilidade/go-types-infrastructure';
import { MapOverlayPatternShape, MapView, Section, Text } from '@tmlmobilidade/ui';
import { useState } from 'react';

import styles from '../ShapeEditorContent/styles.module.css';

import { ShapeEditorStopSelect } from '../ShapeEditorStopSelect';

/* * */

interface InitialStopSelectorProps {
	isLoading: boolean
	lineColor: string | undefined
	lineData: unknown
	onInitialize: (firstStop: Stop, secondStop: Stop) => void
}

/* * */

export function InitialStopSelector({ isLoading, lineColor, lineData, onInitialize }: InitialStopSelectorProps) {
	//

	//
	// A. Setup variables

	const [firstStop, setFirstStop] = useState<null | Stop>(null);

	//
	// B. Handle actions

	const handleFirst = (stop: null | Stop) => {
		setFirstStop(stop);
	};

	const handleSecond = (stop: null | Stop) => {
		if (!stop || !firstStop) return;
		onInitialize(firstStop, stop);
	};

	//
	// C. Render components

	return (
		<div className={styles.container}>
			<Section gap="md" width="30%">
				<Text size="xl" weight="semibold">Sequência de paragens</Text>
				<Text>Ainda não existem paragens neste percurso. Adicione as duas primeiras paragens para calcular o percurso.</Text>
				<ShapeEditorStopSelect
					disabled={isLoading}
					label="Primeira paragem"
					onChange={handleFirst}
					value={firstStop}
				/>
				{firstStop && (
					<ShapeEditorStopSelect
						disabled={isLoading}
						excludeStopIds={[firstStop._id]}
						label="Segunda paragem"
						onChange={handleSecond}
						value={null}
					/>
				)}
			</Section>

			<div className={styles.mapWrapper}>
				<MapView id="shapeMapView">
					<MapOverlayPatternShape
						id="pattern-shape"
						lineColor={lineColor}
						lineData={lineData as never}
						stopsData={{ features: [], type: 'FeatureCollection' }}
					/>
				</MapView>
			</div>
		</div>
	);

	//
}
