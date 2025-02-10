import { Alert } from '@tmlmobilidade/core/types';
import { Cause, Effect, EntitySelector, Alert as ServiceAlert } from 'gtfs-types';

function parseServiceAlert(alert: Alert): ServiceAlert {
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

	return {
		active_period: {
			end: alert.active_period_end_date.getTime() / 1000,
			start: alert.active_period_start_date.getTime() / 1000,
		},
		cause: Cause[alert.cause],
		description_text: {
			translation: [
				{
					language: 'pt-PT',
					text: alert.description,
				},
			],
		},
		effect: Effect[alert.effect],
		header_text: {
			translation: [
				{
					language: 'pt-PT',
					text: alert.title,
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
	};
}

export { parseServiceAlert };
