'use client';

import { CopyBadge } from '@/components/common/display/CopyBadge';
import { useLinesData } from '@/components/lines/use-lines-data';
import { useVehiclesDetailContext } from '@/components/vehicles/detail/VehiclesDetail.context';
import { getAgencyLogo } from '@/lib/agency-catalog';
import { API_ROUTES } from '@tmlmobilidade/consts';
import { type HubPattern } from '@tmlmobilidade/go-types-hub';
import { type ApiResponse } from '@tmlmobilidade/go-types-shared';
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

	const { data: lines } = useLinesData();
	const vehiclesDetailContext = useVehiclesDetailContext();
	const agencyLogo = getAgencyLogo(vehiclesDetailContext.data.vehicle?.agency_id, '180x120', 'light');

	//
	// B. Fetch data

	const activePatternId = vehiclesDetailContext.data.vehicle?.route_id && vehiclesDetailContext.data.vehicle.direction_id !== undefined
		? `${vehiclesDetailContext.data.vehicle.route_id}_${vehiclesDetailContext.data.vehicle.direction_id}`
		: null;
	const { data: activePatternResponse } = useSWR<ApiResponse<HubPattern[]>>(activePatternId ? API_ROUTES.hub.NETWORK_PATTERNS(activePatternId) : null, {
		fetcher: async url => await fetchApiData<HubPattern[]>({ options: { credentials: 'omit' }, url }),
	});
	const activePatternData = activePatternResponse?.data;

	const activeLineData = useMemo(() => {
		if (!vehiclesDetailContext.data.vehicle?.route_id) return;
		return lines.find(line => line._id === vehiclesDetailContext.data.vehicle?.route_id);
	}, [lines, vehiclesDetailContext.data.vehicle?.route_id]);

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
					{agencyLogo && <Image alt="" height={40} src={agencyLogo} width={60} />}
				</div>

				<LineName
					align="center"
					longName={t('default:vehicles.VehiclesDetailView.destination', '', {
						destination: activePatternData?.[0]?.headsign ?? t('default:vehicles.VehiclesDetailView.unknown_destination'),
					})}
				/>

				<CopyBadge value={vehiclesDetailContext.data.vehicle?.vehicle_id} />

				<p className={styles.lastSeenLabel}>{t('default:vehicles.VehiclesDetailView.seen_seconds_ago', '', { count: differenceInSeconds })}</p>

			</div>
		</Section>
	);
}
