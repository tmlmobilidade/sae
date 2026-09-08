'use client';

import { AgencyDisplay } from '@/components/common/AgencyDisplay';
import { FeedInfoDisplay } from '@/components/common/FeedInfoDisplay';
import { AlertMessage, Divider, FileUpload, Label, Section, Select } from '@tmlmobilidade/ui';
import { type FieldErrors } from 'react-hook-form';

import { useValidationCreateContext } from '../ValidationCreateForm.context';

/* * */

function collectErrorMessages(errors: FieldErrors, path = ''): string[] {
	const messages: string[] = [];

	for (const [key, value] of Object.entries(errors)) {
		if (!value || typeof value !== 'object') continue;

		const nextPath = path ? `${path}.${key}` : key;

		if ('message' in value && typeof value.message === 'string') {
			messages.push(`${nextPath}: ${value.message}`);
			continue;
		}

		messages.push(...collectErrorMessages(value as FieldErrors, nextPath));
	}

	return messages;
}

/* * */

export function ValidationCreateBasicInfo() {
	//

	//
	// A. Setup variables

	const validationCreateContext = useValidationCreateContext();
	const gtfsAgency = validationCreateContext.form.watch('gtfs_agency');
	const gtfsFeedInfo = validationCreateContext.form.watch('gtfs_feed_info');
	const formErrorMessages = collectErrorMessages(validationCreateContext.form.formState.errors);

	//
	// B. Render components

	return (
		<>

			{validationCreateContext.data.validationError && (
				<>
					<AlertMessage title={validationCreateContext.data.validationError.message} variant="danger" />
					<Divider />
				</>
			)}

			{formErrorMessages.length > 0 && (
				<>
					{formErrorMessages.map(message => (
						<AlertMessage key={message} title={message} variant="danger" />
					))}
					<Divider />
				</>
			)}

			{validationCreateContext.data.agencyOptions.length > 1 && (
				<>
					<Section gap="sm">
						<Label size="lg">Selecione a agência para a validação</Label>
						<Select
							clearable={false}
							data={validationCreateContext.data.agencyOptions}
							onChange={validationCreateContext.actions.setSelectedAgencyId}
							value={validationCreateContext.data.selectedAgencyId}
							w="100%"
						/>
					</Section>
					<Divider />
				</>
			)}

			{gtfsAgency && (
				<>
					<Section gap="sm">
						<Label size="lg">agency.txt</Label>
						<AgencyDisplay data={gtfsAgency} />
					</Section>
					<Divider />
				</>
			)}

			{gtfsFeedInfo && (
				<>
					<Section gap="sm">
						<Label size="lg">feed_info.txt</Label>
						<FeedInfoDisplay data={gtfsFeedInfo} />
					</Section>
					<Divider />
				</>
			)}

			<Section>
				<FileUpload
					accept="application/zip"
					label="Selecionar Arquivo GTFS"
					maxFileSize={5 * 1024 * 1024 * 1024} // 5 GB
					onFileChange={validationCreateContext.actions.setValidationFile}
				/>
			</Section>

		</>
	);

	//
}
