'use client';

/* * */

import { Label } from '@/components/Label';
import { useRidesContext } from '@/contexts/Rides.context';
import { ViewportList } from 'react-viewport-list';

import { SeenStatus } from '../SeenStatus';
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
				<div className={styles.row}>
					<div className={styles.cell} />
					<div className={styles.cell}>
						<Label size="sm" caps>Estado</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>Pattern</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>Partida</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>Observado</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>Motorista</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>Veículo</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>Validações</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>SIMPLE_THREE_VEHICLE_EVENTS</Label>
					</div>
				</div>
			</div>

			<div className={styles.body}>
				<ViewportList itemMargin={0} items={ridesContext.data.rides_display}>
					{item => (
						<div key={item._ride._id} className={styles.row}>
							<div className={styles.cell}>
								<SeenStatus value={item.seen_status} />
							</div>
							<div className={styles.cell}>
								{item._ride._id}
							</div>
							<div className={styles.cell}>
								{String(item._ride.start_time_scheduled)}
							</div>
							<div className={styles.cell}>
								{item._ride.validations_count || -1}
							</div>
							<div className={styles.cell}>
								{String(item._ride.seen_last_at)}
							</div>
						</div>
					)}
				</ViewportList>
			</div>

		</div>
	);

	//
}
