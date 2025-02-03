'use client';

/* * */

import { useRidesContext } from '@/contexts/Rides.context';
import { ViewportList } from 'react-viewport-list';

import styles from './styles.module.css';

/* * */

export function DataTable() {
	//

	//
	// A. Setup variables

	const ridesContext = useRidesContext();

	//
	// B. Render components

	return (
		<div className={styles.wrapper}>

			<div className={styles.header}>
				<div className={styles.cell} />
				<div className={styles.cell}>
					Estado
				</div>
				<div className={styles.cell}>
					Pattern
				</div>
				<div className={styles.cell}>
					Partida
				</div>
				<div className={styles.cell}>
					Observado
				</div>
				<div className={styles.cell}>
					Motorista
				</div>
				<div className={styles.cell}>
					Veículo
				</div>
				<div className={styles.cell}>
					Validações
				</div>
				<div className={styles.cell}>
					SIMPLE_THREE_VEHICLE_EVENTS
				</div>
			</div>

			<div className={styles.body}>
				<ViewportList itemMargin={0} items={ridesContext.data.rides_display}>
					{item => (
						<div key={item._id} className={styles.row}>
							<div className={styles.cell}>
								{item._id}
							</div>
							<div className={styles.cell}>
								{String(item.start_time_scheduled)}
							</div>
							<div className={styles.cell}>
								{item.validations_count || -1}
							</div>
							<div className={styles.cell}>
								{String(item.seen_last_at)}
							</div>
						</div>
					)}
				</ViewportList>
			</div>

		</div>
	);

	//
}
