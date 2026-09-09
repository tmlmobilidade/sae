'use client';

import { IconLink } from '@tabler/icons-react';
import { Grid, Section, StandardFormController, Textarea, TextInput } from '@tmlmobilidade/ui';
import { useTranslation } from 'react-i18next';

import { useAlertsDetailFormContext } from '../AlertsDetailForm.context';

/* * */

export function AlertsDetailSectionTextsForm() {
	//

	//
	// A. Setup variables

	const { t } = useTranslation();

	const { capabilities, form } = useAlertsDetailFormContext();

	//
	// B. Render components

	return (
		<>

			<Section gap="md">
				<Grid gap="md">

					<StandardFormController
						control={form.control}
						name="title"
						render={({ field, fieldState }) => (
							<TextInput
								disabled={!capabilities.editEnabled}
								error={fieldState.error?.message}
								label={t('alerts:create.summary.title.label')}
								onBlur={field.onBlur}
								onChange={e => field.onChange(e.currentTarget.value)}
								value={field.value ?? ''}
							/>
						)}
					/>

					<StandardFormController
						control={form.control}
						name="description"
						render={({ field, fieldState }) => (
							<Textarea
								disabled={!capabilities.editEnabled}
								error={fieldState.error?.message}
								label={t('alerts:create.summary.description.label')}
								minRows={4}
								onBlur={field.onBlur}
								onChange={e => field.onChange(e.currentTarget.value)}
								value={field.value ?? ''}
								autosize
							/>
						)}
					/>

					{/* <StandardFormController
						control={form.control}
						name="coordinates"
						render={({ field }) => (
							<CoordinatesInput
								key="key"
								label={t('alerts:create.summary.coordinates.label')}
								// onChange={nextValue => field.onChange(normalizeAlertCoordinatesInput(nextValue))}
								value={field.value ?? undefined}
							/>
						)}
					/> */}

					<StandardFormController
						control={form.control}
						name="info_url"
						render={({ field, fieldState }) => (
							<TextInput
								description={t('alerts:create.summary.info_url.description')}
								error={fieldState.error?.message}
								label={t('alerts:create.summary.info_url.label')}
								leftSection={<IconLink />}
								onBlur={field.onBlur}
								onChange={e => field.onChange(e.currentTarget.value)}
								placeholder="https://www.cm-setubal.com/..."
								readOnly={!capabilities.editEnabled}
								value={field.value ?? ''}
							/>
						)}
					/>

				</Grid>
			</Section>

			{/* <Divider /> */}

			{/* <Section gap="md">
				<UploadImage
					label="Imagem"
					// onDelete={actions.deleteImage}
					// onUpload={actions.uploadImage}
					// value={image?.url}
				/>
			</Section> */}

		</>
	);
}
