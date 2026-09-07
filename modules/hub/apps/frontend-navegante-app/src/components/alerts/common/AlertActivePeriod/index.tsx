/* * */

import { type UnixMilliseconds } from '@tmlmobilidade/go-types-shared';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

/* * */

interface AlertActivePeriodStartProps {
	date?: UnixMilliseconds
	size?: 'md' | 'sm'
}

/* * */

export function AlertActivePeriodStart({ date, size = 'md' }: AlertActivePeriodStartProps) {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	//
	// B. Render components

	if (date && !isNaN(date)) {
		return <p className={`${styles.text} ${styles[size]}`}>{t('default:alerts.AlertActivePeriod.start', '', { value: date })}</p>;
	}

	//
}
