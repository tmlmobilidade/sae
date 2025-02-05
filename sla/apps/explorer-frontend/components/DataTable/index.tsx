'use client';

/* * */

import { Label } from '@/components/Label';
import { SeenStatusBadge } from '@/components/SeenStatusBadge';
import { useRidesContext } from '@/contexts/Rides.context';
import { Badge } from '@tmlmobilidade/ui';
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
				<div className={styles.row}>
					<div className={styles.cell} />
					<div className={styles.cell}>
						<Label size="sm" caps>Estado</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>Pattern</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>Ride ID</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>Partida</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>Validações</Label>
					</div>
				</div>
			</div>

			<div className={styles.body}>
				<ViewportList itemMargin={0} items={ridesContext.data.rides_display}>
					{item => (
						<div key={item._ride._id} className={styles.row}>
							<div className={styles.cell}>
								<SeenStatusBadge value={item.seen_status} />
							</div>
							<div className={styles.cell}>
								<Badge size="sm" variant="secondary">
									{item.operational_status}
								</Badge>
							</div>
							<div className={styles.cell}>
								<Label lines={1} size="md">{item._ride.pattern_id}{item._ride.headsign}</Label>
							</div>
							<div className={styles.cell}>
								<Label lines={1} size="md">{item._ride._id}</Label>
							</div>
							<div className={styles.cell}>
								<Label lines={1} size="md">{String(item._ride.start_time_scheduled).substring(0, 19)}</Label>
							</div>
							<div className={styles.cell}>
								<Label lines={1} size="md">{item._ride.validations_count}</Label>
							</div>
						</div>
					)}
				</ViewportList>
			</div>

		</div>
	);

	//
}
