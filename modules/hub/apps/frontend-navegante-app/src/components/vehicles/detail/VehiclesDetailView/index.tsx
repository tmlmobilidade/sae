'use client';

import { CopyBadge } from '@/components/common/display/CopyBadge';
import { useLinesContext } from '@/components/lines/Lines.context';
import { useVehiclesDetailContext } from '@/components/vehicles/detail/VehiclesDetail.context';
import { getAgencyLogo } from '@/lib/agency-logos-map';
import { API_ROUTES } from '@tmlmobilidade/consts';
import { type HubV1ApiPattern } from '@tmlmobilidade/go-types-hub';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { fetchApiData, LineBadge, LineName, Section } from '@tmlmobilidade/ui';
import Image from 'next/image';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import styles from './styles.module.css';

/* * */

export function VehiclesDetailView() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const linesContext = useLinesContext();
	const vehiclesDetailContext = useVehiclesDetailContext();

	//
	// B. Fetch data

	const { data: activePatternData } = useSWR(vehiclesDetailContext.data.vehicle?.shape_id && API_ROUTES.hub.NETWORK_PATTERNS(vehiclesDetailContext.data.vehicle.shape_id), {
		fetcher: async (url: string) => await fetchApiData<HubV1ApiPattern[]>({ credentials: 'omit', url }),
		refreshInterval: 5_000, // 5 seconds
	});

	const activeHeadsign = useMemo(() => {
		if (!activePatternData) return 'desconhecido';
		return activePatternData.data?.[0]?.headsign ?? 'desconhecido';
	}, [activePatternData]);

	const activeLineData = useMemo(() => {
		if (!vehiclesDetailContext.data.vehicle?.route_short_name) return;
		return linesContext.data.lines.find(line => line.short_name === vehiclesDetailContext.data.vehicle?.route_short_name);
	}, [linesContext.data.lines, vehiclesDetailContext.data.vehicle?.route_short_name]);

	const differenceInSeconds = useMemo(() => {
		if (!vehiclesDetailContext.data.vehicle?.created_at) return;
		const nowUnixMilliseconds = Dates.now('Europe/Lisbon').unix_milliseconds;
		const differenceInMilliseconds = nowUnixMilliseconds - vehiclesDetailContext.data.vehicle?.created_at;
		const differenceInSeconds = differenceInMilliseconds / 1000;
		return Math.round(differenceInSeconds);
	}, [vehiclesDetailContext.data.vehicle?.created_at]);

	//
	// C. Render components

	return (
		<Section>
			<div className={styles.vehicleInfoWrapper}>

				<div className={styles.lineInfoWrapper}>
					<LineBadge color={activeLineData?.color} shortName={activeLineData?.short_name} size="full-width" textColor={activeLineData?.text_color} />
					<Image alt="" height={40} src={getAgencyLogo(vehiclesDetailContext.data.vehicle?.agency_id, '180x120', 'light')} width={60} />
				</div>

				<LineName align="center" longName={`Destino: ${activeHeadsign}`} />

				<CopyBadge value={vehiclesDetailContext.data.vehicle?.vehicle_id} />

				<p className={styles.lastSeenLabel}>{t('default:vehicles.VehiclesDetailView.seen_seconds_ago', '', { count: differenceInSeconds })}</p>

			</div>
		</Section>
	);
}
