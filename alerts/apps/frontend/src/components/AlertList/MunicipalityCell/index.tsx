import { useLocationsContext } from '@/contexts/Locations.context';
import { Tag } from '@tmlmobilidade/ui';

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
				{municipality_ids.slice(0, 2).map((municipality, index) => (
					<Tag key={`${municipality}-${index}`} label={municipalities.find(m => m.id === municipality)?.name} variant="muted" />
				))}
			</div>
			{municipality_ids.length > 2 && (
				<span>+{municipality_ids.length - 2}</span>
			)}
		</div>
	);
}
