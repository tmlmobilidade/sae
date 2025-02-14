import { useStopsContext } from '@/contexts/Stops.context';
import { Tag } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

export default function StopCell({ stop_ids }: { stop_ids: string[] }) {
	//

	//
	// A. Setup Variables
	const { data: { stops } } = useStopsContext();

	//
	// B. Render
	return (
		<div className={styles.wrapper}>
			<div className={styles.badges}>
				{stop_ids.slice(0, 2).map((stop, index) => (
					<Tag key={`${stop}-${index}`} label={stops.find(s => s.id === stop)?.long_name} variant="muted" />
				))}
			</div>
			{stop_ids.length > 2 && <span>+{stop_ids.length - 2}</span>}
		</div>
	);
}
