import { AlertSchema } from '@tmlmobilidade/core-types';
import { Tag } from '@tmlmobilidade/ui';
import { ComponentProps } from 'react';

import styles from './styles.module.css';

export default function StatusCell({ status }: { status: typeof AlertSchema.shape.publish_status.options[number] }) {
	//

	//
	// A. Setup Variables
	let variant: ComponentProps<typeof Tag>['variant'] = 'muted';

	switch (status) {
		case 'DRAFT':
			variant = 'muted';
			break;
		case 'PUBLISHED':
			variant = 'primary';
			break;
		case 'ARCHIVED':
			variant = 'muted';
	}

	//
	// B. Render
	return (
		<div className={styles.wrapper}>
			<Tag label={status} variant={variant} />
		</div>
	);
}
