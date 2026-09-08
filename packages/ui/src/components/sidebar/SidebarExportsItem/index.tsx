'use client';

import { IconCheck, IconCircleDashed, IconFileDownload, IconLoader2, IconX } from '@tabler/icons-react';
import { API_ROUTES } from '@tmlmobilidade/consts';
import { type FileExport } from '@tmlmobilidade/go-types-downloads';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './styles.module.css';

import { useExportsContext } from '../../../contexts';
import { Label } from '../../display';
import { Section } from '../../layout';

/* * */

export interface SidebarExportsItemProps {
	fileExport: FileExport
}

/* * */

export function SidebarExportsItem({ fileExport }: SidebarExportsItemProps) {
	//

	//
	// A. Setup variables
	const { t } = useTranslation();
	const exportsContext = useExportsContext();
	const posterDownloadUrl = fileExport.type === 'plan_posters' && fileExport.processing_status === 'complete'
		? fileExport.download_url || (fileExport.file_id ? API_ROUTES.exporter.EXPORTER_DETAIL_DOWNLOAD(fileExport._id) : undefined)
		: undefined;
	const Root = posterDownloadUrl ? 'a' : 'div';

	const icon = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
		switch (fileExport.processing_status) {
			case 'complete':
				return <IconCheck color="var(--color-status-success-primary)" size={28} />;
			case 'processing':
				return <IconLoader2 className={styles.iconSpinner} color="var(--color-status-warning-primary)" size={28} />;
			case 'waiting':
				return <IconCircleDashed color="var(--color-system-text-200)" size={28} stroke={1.5} />;
			default:
				return <IconX color="var(--color-status-danger-primary)" size={28} stroke={1.5} />;
		}
	}, [fileExport.processing_status]);

	//
	// B. Render components

	return (
		<Root
			className={styles.root}
			href={posterDownloadUrl}
			onClick={() => !posterDownloadUrl && fileExport.processing_status === 'complete' && exportsContext.actions.download(fileExport._id)}
			rel={posterDownloadUrl ? 'noopener noreferrer' : undefined}
			target={posterDownloadUrl ? '_blank' : undefined}
		>
			<div className={styles.left}>
				<Section flexDirection="row" gap="sm" justifyContent="space-between" padding="none" width="fit-content">
					<div className={styles.iconWrapper}>{icon}</div>
					<div>
						<Label size="md">{fileExport.file_name || t('shared:components.sidebar.SidebarExportsItem.no_name')}</Label>
						<div className={styles.body}>
							<Label size="sm">{posterDownloadUrl ? t('shared:components.sidebar.SidebarExportsItem.download_posters') : fileExport.processing_status}</Label>
						</div>
					</div>
				</Section>
			</div>
			{fileExport.processing_status === 'complete' && (
				<div className={styles.right}>
					<IconFileDownload size={28} />
				</div>
			)}
		</Root>
	);

	//
};
