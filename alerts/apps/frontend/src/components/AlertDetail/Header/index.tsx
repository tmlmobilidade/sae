'use client';

import BackButton from '@/components/common/BackButton';
import { AlertDetailMode, useAlertDetailContext } from '@/contexts/AlertDetail.context';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { Badge, Button, Surface, Text } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

export default function Header() {
	const { actions, data, flags } = useAlertDetailContext();

	return (
		<Surface alignItems="center" flexDirection="row" justifyContent="space-between" padding="sm">
			<div className={styles.headerContainer}>
				<BackButton />
				<Badge variant="muted">{data.form.getValues().publish_status}</Badge>
				<Text size="xl" weight="bold">{data.form.getValues()._id}</Text>
			</div>
			<div className={styles.headerContainer}>
				<Button disabled={!flags.canSave} loading={flags.isSaving} onClick={actions.saveAlert} variant="primary">
					<IconUpload size={28} />
					<div>{flags.mode === AlertDetailMode.CREATE ? 'Publicar' : 'Salvar'}</div>
				</Button>
				{flags.mode === AlertDetailMode.EDIT && (
					<Button onClick={actions.deleteAlert} variant="danger">
						<IconTrash size={28} />
						<div>Apagar</div>
					</Button>
				)}
			</div>
		</Surface>
	);
}
