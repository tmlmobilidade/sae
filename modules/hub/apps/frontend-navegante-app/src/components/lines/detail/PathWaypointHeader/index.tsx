/* * */

import { useStopsData } from '@/components/stops/use-stops-data';
import { formatStopLocation } from '@/utils/transit/format-stop-location';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { type HubWaypoint } from '@tmlmobilidade/go-types-hub';
import { useClipboard } from '@tmlmobilidade/ui';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

interface Props {
	isFirstStop?: boolean
	isLastStop?: boolean
	isSelected: boolean
	waypointData: HubWaypoint
}

/* * */

export function PathWaypointHeader({ isFirstStop, isLastStop, isSelected, waypointData }: Props) {
	//

	//
	// A. Setup variables

	const { data: stops } = useStopsData();
	const { t } = useTranslation();

	const stopIdClipboard = useClipboard();

	//
	// B. Fetch data

	const stopData = stops.find(stop => String(stop._id) === String(waypointData.stop_id));

	//
	// C. Handle actions

	const handleClickStopId = () => {
		if (!isSelected) return;
		stopIdClipboard.copy(waypointData.stop_id);
	};
	//
	// D. Render components

	if (!stopData) {
		return null;
	}

	return (
		<div
			className={`${styles.container} ${isFirstStop && styles.isFirstStop} ${isLastStop && styles.isLastStop} ${isSelected && styles.isSelected}`}
			role="button"
			aria-label={t(`default:lines.LinesDetailPath.stop_details_name`, '', {
				index: waypointData.stop_sequence,
				stop_name: stopData.name,
			})}
		>
			<p className={styles.stopName}>
				{stopData.name}
			</p>

			<div aria-hidden={true} className={styles.subHeaderWrapper}>
				<p className={styles.stopLocation}>{formatStopLocation(stopData.locality_name, stopData.municipality_name)}</p>
				<p className={`${styles.stopId} ${stopIdClipboard.copied && styles.isCopied}`} onClick={handleClickStopId}>
					#{stopData._id}
					{stopIdClipboard.copied ? <IconCheck className={styles.stopIdCopyIcon} /> : <IconCopy className={styles.stopIdCopyIcon} />}
				</p>
			</div>
		</div>
	);
}
