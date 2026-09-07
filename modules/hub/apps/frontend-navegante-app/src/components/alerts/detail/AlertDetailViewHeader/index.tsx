'use client';

import { AlertEffectIcon } from '@/components/alerts/common/AlertEffectIcon';
import { type HubAlert } from '@tmlmobilidade/go-types-hub';
import { Section, Surface } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

interface AlertDetailViewHeaderProps {
	effect: HubAlert['effect']
	title: string
}

/* * */

export function AlertDetailViewHeader({ effect, title }: AlertDetailViewHeaderProps) {
	//

	//
	// B. Render componentss

	return (
		<Surface variant="plain">
			<Section gap="sm">
				<div className={styles.row}>
					<AlertEffectIcon effect={effect} />
					<h1 className={styles.alertTitle}>
						{title}
					</h1>
				</div>
			</Section>
		</Surface>
	);
}
