'use client';

/* * */

import { Label } from '@/components/Label';
import { SeenStatusTag } from '@/components/SeenStatusTag';
import { useRidesContext } from '@/contexts/Rides.context';
import { IconCreditCardPay } from '@tabler/icons-react';
import { Tag } from '@tmlmobilidade/ui';
import { ViewportList } from 'react-viewport-list';

import { AnalysisStatusTag } from '../AnalysisStatusTag';
import { OperationalStatusTag } from '../OperationalStatusTag';
import { StartTimeStatusTag } from '../StartTimeStatusTag';
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
						<Label size="sm" caps>Validações</Label>
					</div>
					<div className={styles.cell}>
						<Label size="sm" caps>SIMPLE_THREE_VEH...</Label>
					</div>
					{/* <div className={styles.cell}>
						<Label size="sm" caps>Ride ID</Label>
					</div> */}
				</div>
			</div>

			<div className={styles.body}>
				<ViewportList itemMargin={0} items={ridesContext.data.rides_display}>
					{item => (
						<div key={item._id} className={styles.row}>
							<div className={styles.cell}>
								<SeenStatusTag value={item.seen_status} />
							</div>
							<div className={styles.cell}>
								<OperationalStatusTag value={item.operational_status} />
							</div>
							<div className={styles.cell}>
								<Tag label={item.pattern_id} variant="secondary" />
								<Label lines={1} size="md">{item.headsign}</Label>
							</div>
							<div className={styles.cell}>
								<Tag label={item.start_time_scheduled_display} variant="primary" />
							</div>
							<div className={styles.cell}>
								<StartTimeStatusTag status={item.delay_status} timeString={item.start_time_observed_display} />
							</div>
							<div className={styles.cell}>
								{item.validations_count > 0 && <Tag icon={<IconCreditCardPay />} label={item.validations_count} variant="secondary" />}
							</div>
							<div className={styles.cell}>
								<AnalysisStatusTag grade={item.simple_three_vehicle_events_grade} operationalStatus={item.operational_status} />
							</div>
							{/* <div className={styles.cell}>
								{item._id}
							</div> */}
						</div>
					)}
				</ViewportList>
			</div>

		</div>
	);

	//
}
