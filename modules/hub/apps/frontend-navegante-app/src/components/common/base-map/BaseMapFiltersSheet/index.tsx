'use client';

import { useMapContext } from '@/contexts/Map.context';
import { getAgencyDisplayInfo, getAgencyLogo } from '@/lib/agency-catalog';
import { type BaseMapOverlayType } from '@/types/common/map';
import { BASE_MAP_OPERATOR_IDS } from '@/utils/map/base-map-operators';
import { IconAlertTriangle, IconBus, IconCheck } from '@tabler/icons-react';
import Image from 'next/image';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

interface MapOverlayOption {
	icon: ReactNode
	label: string
	value: BaseMapOverlayType
}

/* * */

export function BaseMapFiltersSheet() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();
	const mapContext = useMapContext();

	//
	// B. Transform data

	const overlayOptions: MapOverlayOption[] = [
		{
			icon: <IconBus size={28} />,
			label: t('default:map.BaseMapOverlaysControl.layers.vehicles'),
			value: 'vehicles',
		},
		{
			icon: <IconAlertTriangle size={28} />,
			label: t('default:map.BaseMapOverlaysControl.layers.alerts'),
			value: 'alerts',
		},
	];

	//
	// C. Render components

	return (
		<div className={styles.container}>
			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>{t('default:map.BaseMapOverlaysControl.sections.map_details')}</h2>

				<div className={styles.overlayGrid}>
					{overlayOptions.map((option) => {
						const isActive = mapContext.data.activeBaseMapOverlays.includes(option.value);

						return (
							<button
								key={option.value}
								aria-pressed={isActive}
								className={styles.overlayButton}
								data-active={isActive}
								onClick={() => mapContext.actions.toggleBaseMapOverlay(option.value)}
								type="button"
							>
								<span className={styles.overlayIcon}>{option.icon}</span>
								<span>{option.label}</span>
								{isActive && <IconCheck className={styles.overlayCheck} size={18} />}
							</button>
						);
					})}
				</div>
			</section>

			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>{t('default:map.BaseMapOverlaysControl.sections.operators')}</h2>
				<p className={styles.sectionDescription}>{t('default:map.BaseMapOverlaysControl.sections.operators_description')}</p>

				<div className={styles.operatorGrid}>
					{BASE_MAP_OPERATOR_IDS.map((operatorId) => {
						const isActive = !mapContext.data.excludedBaseMapOperatorIds.includes(operatorId);
						const operator = getAgencyDisplayInfo(operatorId);
						const operatorLogo = getAgencyLogo(operatorId, '180x120', 'light');
						if (!operator || !operatorLogo) return null;

						return (
							<button
								key={operatorId}
								aria-label={operator.fullName}
								aria-pressed={isActive}
								className={styles.operatorButton}
								data-active={isActive}
								onClick={() => mapContext.actions.toggleBaseMapOperator(operatorId)}
								type="button"
							>
								<span className={styles.operatorLogo}>
									<Image alt="" height={35} src={operatorLogo} width={52} />
								</span>
							</button>
						);
					})}
				</div>
			</section>
		</div>
	);

	//
}
