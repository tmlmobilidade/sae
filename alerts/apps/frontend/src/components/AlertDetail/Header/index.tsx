'use client';

import BackButton from '@/components/common/BackButton';
import {
	AlertDetailMode,
	useAlertDetailContext,
} from '@/contexts/AlertDetail.context';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { Button, Surface, Tag, Text } from '@tmlmobilidade/ui';

import styles from './styles.module.css';

export default function Header() {
	const { actions, data, flags } = useAlertDetailContext();

	return (
		<Surface
			alignItems="center"
			flexDirection="row"
			justifyContent="space-between"
			padding="sm"
		>
			<div className={styles.headerContainer}>
				<BackButton />
				<Tag label={data.form.getValues().publish_status} variant={data.form.getValues().publish_status === 'PUBLISHED' ? 'primary' : 'muted'} />
				<Text size="xl" weight="bold">
					{data.form.getValues()._id}
				</Text>
			</div>
			<div className={styles.headerContainer}>
				<Button
					disabled={!flags.canSave}
					icon={<IconUpload size={28} />}
					loading={flags.isSaving}
					onClick={actions.saveAlert}
					variant="primary"
					label={
						flags.mode === AlertDetailMode.CREATE
							? 'Publicar'
							: 'Salvar'
					}
				/>
				{flags.mode === AlertDetailMode.EDIT && (
					<Button
						icon={<IconTrash size={28} />}
						label="Apagar"
						onClick={actions.deleteAlert}
						variant="danger"
					/>
				)}
			</div>
		</Surface>
	);
}
