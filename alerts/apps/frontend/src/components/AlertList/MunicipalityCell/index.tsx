import { useLocationsContext } from '@/contexts/Locations.context';
import { Badge } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

export default function MunicipalityCell({ municipality_ids }: { municipality_ids: string[] }) {
	//

	//
	// A. Setup Variables
	const { data: { municipalities } } = useLocationsContext();

	//
	// B. Render
	return (
		<div className={styles.wrapper}>
			<div className={styles.badges}>
				{municipality_ids.slice(0, 2).map(municipality => (
					<Badge key={municipality} variant="muted">
						{ municipalities.find(m => m.id === municipality)?.name }
					</Badge>
				))}
			</div>
			{municipality_ids.length > 2 && (
				<span>+{municipality_ids.length - 2}</span>
			)}
		</div>
	);
}
