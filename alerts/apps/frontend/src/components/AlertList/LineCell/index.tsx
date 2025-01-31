import { useLinesContext } from "@/contexts/Lines.context";
import { Badge } from "@tmlmobilidade/ui";

import styles from './styles.module.css';

export default function LineCell({ line_ids }: { line_ids: string[] }) {
	//

	//
	// A. Setup Variables
	const { data: { routes } } = useLinesContext();

	//
	// B. Render
	return (
		<div className={styles.wrapper}>
			<div className={styles.badges}>
				{line_ids.slice(0, 2).map((line) => (
					<Badge key={line} variant="muted">
						{routes.find((r) => r.id === line)?.line_id}
					</Badge>
				))}
			</div>
			{line_ids.length > 2 && <span>+{line_ids.length - 2}</span>}
		</div>
	);
}