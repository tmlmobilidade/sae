/* * */

import { getEffectSeverityLevel } from '@/utils/alerts/get-alert-severity-level';
import { type HubAlert } from '@tmlmobilidade/go-types-hub';
import { AlertEffectIcons } from '@tmlmobilidade/ui';
import { type ReactNode } from 'react';

import styles from './styles.module.css';

/* * */

interface AlertEffectIconProps {
	className?: string
	effect?: HubAlert['effect']
}

/* * */

const HUB_ALERT_EFFECT_ICONS: Partial<Record<HubAlert['effect'], ReactNode>> = AlertEffectIcons;

/* * */

export function AlertEffectIcon({ className, effect }: AlertEffectIconProps) {
	//

	//
	// A. Setup variables

	const severityColor = {
		high: styles.levelHigh,
		info: styles.levelInfo,
		low: styles.levelLow,
		medium: styles.levelMedium,
	};

	//
	// B. Transform data

	const effectIcon = effect ? HUB_ALERT_EFFECT_ICONS[effect] : null;
	const effectColor = effect ? severityColor[getEffectSeverityLevel(effect)] : null;

	//
	// C. Render components

	if (!effectIcon || !effectColor) {
		return null;
	}

	return <span className={`${effectColor} ${className ?? ''}`}>{effectIcon}</span>;

	//
}
