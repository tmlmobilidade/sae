'use client';

/* * */

import { ShapeEditorStopsItem } from '@/components/patterns/shape/shape-editor/ShapeEditorStopsItem';
import { type Stop } from '@tmlmobilidade/go-types-infrastructure';
import { PopulatedPath } from '@tmlmobilidade/go-types-offer';
import { DraggableList, Section, Text } from '@tmlmobilidade/ui';
import { useState } from 'react';

import styles from './styles.module.css';

import { useStopsEditorContext } from '../ShapeEditor.context';
import { StopsListRow } from '../ShapeEditorStopsListRow';

/* * */

export function StopsList() {
	//

	//
	// A. Setup variables

	const stopsEditorContext = useStopsEditorContext();

	const [addStopIndex, setAddStopIndex] = useState<null | number>(null);
	const [highlightedStopId, setHighlightedStopId] = useState<null | string>(null);

	const path = stopsEditorContext.data.path as PopulatedPath[];

	//
	// B. Handle actions

	const handleReorder = (newPath: PopulatedPath[], event: { newIndex: number, oldIndex: number }) => {
		const moved = path[event.oldIndex];
		if (moved) {
			setHighlightedStopId(moved._id);
			setTimeout(() => setHighlightedStopId(null), 900);
		}
		void stopsEditorContext.actions.reorderStops(newPath);
	};

	const handleStartAddStop = (index: number) => {
		setAddStopIndex(index);
	};

	const handleCancelAddStop = () => {
		setAddStopIndex(null);
	};

	const handleSelectStop = (stop: null | Stop) => {
		if (!stop || addStopIndex === null) return;
		void stopsEditorContext.actions.addStop(stop, addStopIndex + 1);
		handleCancelAddStop();
	};

	//
	// C. Render components

	return (
		<div className={styles.container}>
			<Text size="xl" weight="semibold">Sequência de paragens</Text>

			<Section padding="none">
				<DraggableList
					getId={pathItem => pathItem._id}
					items={path}
					onReorder={handleReorder}
					renderItem={({ dragHandle, index, item: pathItem }) => {
						const nextPathItem = path[index + 1];
						const isAddingHere = addStopIndex === index;

						return (
							<Section
								className={pathItem._id === highlightedStopId ? styles.justDropped : undefined}
								flexDirection="row"
								gap="xs"
								padding="none"
							>
								{dragHandle}

								<Section padding="none">
									<ShapeEditorStopsItem pathItem={pathItem} rowIndex={index} />

									<StopsListRow
										index={index}
										isAdding={isAddingHere}
										nextPathItem={nextPathItem}
										onAdd={handleStartAddStop}
										onCancel={handleCancelAddStop}
										onSelect={handleSelectStop}
										pathItem={pathItem}
									/>
								</Section>
							</Section>
						);
					}}
				/>
			</Section>
		</div>
	);
}
