/* * */

import { TimestampDisplay } from '@/components/TimestampDisplay';
import { Loader, Skeleton } from '@mantine/core';

import styles from './styles.module.css';

/* * */

interface Props {
	icon?: React.JSX.Element
	isLoading?: boolean
	isValidating?: boolean
	sentiment: 'bad' | 'good' | 'normal'
	size?: 'lg' | 'md' | 'sm'
	timestamp?: number
	title?: string
	valuePrimary?: number | string
	valueSecondary?: number | string
}

/* * */

export function CardDefault({ icon, isLoading = false, isValidating = false, sentiment = 'normal', size = 'md', timestamp = 0, title = '', valuePrimary = 1, valueSecondary = 1 }: Props) {
	//

	if (isLoading) {
		return (
			<Skeleton h="100%" w="100%" />
		);
	}

	return (
		<div className={`${styles.container} ${sentiment && styles[sentiment]} ${size && styles[size]} `}>

			<div className={styles.headerWrapper}>
				{icon && <div className={styles.headerIcon}>{icon}</div>}
				<p className={styles.headerTitle}>{title}</p>
			</div>

			<div className={styles.contentWrapper}>
				<p className={styles.valuePrimary}>{valuePrimary}</p>
				{valueSecondary && <p className={styles.valueSecondary}>{valueSecondary}</p>}
			</div>

			<div className={styles.footerWrapper}>
				<TimestampDisplay timestamp={timestamp} />
				{isValidating && <Loader color="white" opacity={0.5} size={10} />}
			</div>

		</div>
	);

	//
}
