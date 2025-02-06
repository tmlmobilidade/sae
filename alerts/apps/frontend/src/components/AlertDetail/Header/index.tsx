"use client";

import { AlertDetailMode, useAlertDetailContext } from "@/contexts/AlertDetail.context";
import { IconUpload, IconTrash } from "@tabler/icons-react";
import { Surface, Badge, Button, Text } from "@tmlmobilidade/ui";

import styles from './styles.module.css';
import BackButton from "@/components/common/BackButton";

export default function Header() {
	const { data, flags, actions } = useAlertDetailContext();

	return (
		<Surface padding="sm" flexDirection="row" alignItems="center" justifyContent="space-between">
			<div className={styles.headerContainer}>
				<BackButton />
				<Badge variant="muted">{data.form.getValues().publish_status}</Badge>
				<Text size="xl" weight="bold">{data.form.getValues()._id}</Text>
			</div>
			<div className={styles.headerContainer}>
				<Button variant="primary" disabled={!flags.canSave} onClick={actions.saveAlert} loading={flags.isSaving}>
					<IconUpload size={28} />
					<div>{flags.mode === AlertDetailMode.CREATE ? 'Publicar' : 'Salvar'}</div>
				</Button>
				{flags.mode === AlertDetailMode.EDIT && (
					<Button variant="danger" onClick={actions.deleteAlert}>
						<IconTrash size={28} />
						<div>Apagar</div>
					</Button>
				)}
			</div>
		</Surface>
	);
}