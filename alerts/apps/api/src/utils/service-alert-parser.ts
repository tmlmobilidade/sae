import { files } from '@tmlmobilidade/core/interfaces';
import { Alert } from '@tmlmobilidade/core/types';
import { EntitySelector, Alert as ServiceAlert } from 'gtfs-types';

interface ServiceAlertExtended extends Omit<ServiceAlert, 'cause' | 'effect'> {
	cause: string
	effect: string
	file_id?: string
	image?: {
		localizedImage: {
			language: string
			media_type: string
			url: string
		}[]
	}
}

interface ServiceAlertResponse {
	alert: ServiceAlertExtended
	id: string
}

async function parseServiceAlert(alert: Alert): Promise<ServiceAlertResponse> {
	const informed_entity = (): EntitySelector[] => {
		const informed_entity: EntitySelector[] = [];

		switch (alert.reference_type) {
			case 'agency':
				alert.references.forEach((reference) => {
					informed_entity.push({
						agency_id: reference.parent_id,
					});
				});
				break;
			case 'route':
				alert.references.forEach((reference) => {
					reference.child_ids.forEach((child_id) => {
						informed_entity.push({
							route_id: reference.parent_id,
							stop_id: child_id,
						});
					});
				});
				break;
			case 'stop':
				alert.references.forEach((reference) => {
					reference.child_ids.forEach((child_id) => {
						informed_entity.push({
							route_id: child_id,
							stop_id: reference.parent_id,
						});
					});
				});
				break;
		}

		return informed_entity;
	};

	const file = await files.findById(alert.file_id);

	return {
		alert: {
			active_period: {
				end: alert.active_period_end_date.getTime() / 1000,
				start: alert.active_period_start_date.getTime() / 1000,
			},
			cause: alert.cause,
			description_text: {
				translation: [
					{
						language: 'pt',
						text: alert.description,
					},
				],
			},
			effect: alert.effect,
			header_text: {
				translation: [
					{
						language: 'pt',
						text: alert.title,
					},
				],
			},
			image: file && {
				localizedImage: [
					{
						language: 'pt-PT',
						media_type: file.type ?? 'image/png',
						url: await files.getFileUrl({ file_id: alert.file_id }),
					},
				],
			},
			informed_entity: informed_entity(),
			url: {
				translation: [
					{
						language: 'pt-PT',
						text: alert.info_url ?? '',
					},
				],
			},
		},
		id: alert._id,
	};
}

export { parseServiceAlert };
