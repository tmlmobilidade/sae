'use client';

import { useVehiclesDetailContext } from '@/contexts/VehiclesDetail.context';
import { getBaseGeoJsonFeatureCollection, transformVehicleDataIntoGeoJsonFeature } from '@tmlmobilidade/geo';
import { Collapsible, MapOverlayVehicles, MapView } from '@tmlmobilidade/ui';
import { useMemo } from 'react';

import styles from './styles.module.css';
/* * */

export function VehicleDetailsMap() {
	//

	//
	// A. Setup variables

	const vehiclesDetailContext = useVehiclesDetailContext();

	const vehiclePositionGeoJson = useMemo(() => {
		const collection = getBaseGeoJsonFeatureCollection<GeoJSON.Point, GeoJSON.GeoJsonProperties>();
		if (vehiclesDetailContext.data.position) {
			collection.features.push(transformVehicleDataIntoGeoJsonFeature(vehiclesDetailContext.data.position, vehiclesDetailContext.data.vehicle));
		}
		return collection;
	}, [vehiclesDetailContext.data.position, vehiclesDetailContext.data.vehicle]);

	//
	// B. Render components

	return (
		<Collapsible description="Última posição reportada do veículo." title="Mapa da posição atual" defaultOpen>
			<div className={styles.mapWrapper}>
				<MapView id="VehicleDetailsMap" toolbar={false}>
					<MapOverlayVehicles vehiclesData={vehiclePositionGeoJson} />
				</MapView>
			</div>
		</Collapsible>
	);

	//
}
