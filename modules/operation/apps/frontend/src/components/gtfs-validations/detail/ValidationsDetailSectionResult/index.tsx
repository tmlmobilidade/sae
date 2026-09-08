'use client';

import { SeverityTag } from '@/components/common/SeverityTag';
import { ValidationsDetailSectionResultCellRows } from '@/components/gtfs-validations/detail/ValidationsDetailSectionResultCellRows';
import { useValidationsDetailContext } from '@/components/gtfs-validations/detail/ValidationsDetailForm.context';
import { getGtfsScheduleDocUrl } from '@/lib/gtfs-schedule-doc-url';
import { IconExternalLink } from '@tabler/icons-react';
import { type GtfsValidationOutputMessage } from '@tmlmobilidade/go-types-gtfs-validator';
import { Collapsible, DataTable, DataTableColumn, Divider, Section } from '@tmlmobilidade/ui';
import { useMemo, useState } from 'react';

import styles from './styles.module.css';

/* * */

export function ValidationsDetailSectionResult() {
	//

	//
	// A. Setup variables

	const validationsDetailContext = useValidationsDetailContext();
	const [selectedSeverity, setSelectedSeverity] = useState<'error' | 'warning' | null>(null);

	const columns: DataTableColumn<GtfsValidationOutputMessage>[] = [
		{
			accessor: 'file_name',
			title: 'Ficheiro',
			width: 180,
		},
		{
			accessor: 'field',
			title: 'Campo',
			width: 250,
		},
		{
			accessor: 'severity',
			render: item => <SeverityTag severity={item.severity} />,
			title: 'Severidade',
			width: 100,
		},
		{
			accessor: 'message',
			render: item => <div>{item.message} {' | '} <a className={styles.link} href={getGtfsScheduleDocUrl(item.rule_id)} rel="noopener noreferrer" target="_blank">Saber mais <IconExternalLink size={12} /></a></div>,
			title: 'Mensagem',
			width: 500,
		},
		{
			accessor: 'rows',
			render: item => <ValidationsDetailSectionResultCellRows rows={item.rows} />,
			title: 'Linhas do Ficheiro',
			width: 600,
		},
	];

	//
	// B. Transform data

	const severityCountLabels = useMemo(() => {
		const summary = validationsDetailContext.data.validation?.summary;
		const totalErrors = summary?.total_errors ?? 0;
		const totalWarnings = summary?.total_warnings ?? 0;

		return {
			error: totalErrors === 1 ? `${totalErrors} Erro` : `${totalErrors} Erros`,
			warning: totalWarnings === 1 ? `${totalWarnings} Aviso` : `${totalWarnings} Avisos`,
		};
	}, [validationsDetailContext.data.validation]);

	const filteredMessages = useMemo(() => {
		const messages = validationsDetailContext.data.validation?.summary?.messages ?? [];
		const messagesWithoutIgnored = messages.filter(message => message.severity !== 'ignore');
		if (!selectedSeverity) return messagesWithoutIgnored;
		return messagesWithoutIgnored.filter(message => message.severity === selectedSeverity);
	}, [selectedSeverity, validationsDetailContext.data.validation]);

	//
	// C. Render components

	if (validationsDetailContext.data.validation?.processing_status !== 'complete' && validationsDetailContext.data.validation?.processing_status !== 'error') {
		return null;
	}

	return (
		<Collapsible
			defaultOpen={true}
			description="Informações, avisos e erros encontrados no arquivo GTFS"
			title="Resultado da Validação"
		>
			<Section flexDirection="row" gap="md">
				<SeverityTag
					dimmed={selectedSeverity === 'warning'}
					label={severityCountLabels.error}
					onClick={() => setSelectedSeverity(prev => prev === 'error' ? null : 'error')}
					selected={selectedSeverity === 'error'}
					severity="error"
				/>
				<SeverityTag
					dimmed={selectedSeverity === 'error'}
					label={severityCountLabels.warning}
					onClick={() => setSelectedSeverity(prev => prev === 'warning' ? null : 'warning')}
					selected={selectedSeverity === 'warning'}
					severity="warning"
				/>
			</Section>
			<Divider />
			<div style={{ overflowX: 'auto' }}>
				<DataTable columns={columns} records={filteredMessages} />
			</div>
		</Collapsible>
	);

	//
}
