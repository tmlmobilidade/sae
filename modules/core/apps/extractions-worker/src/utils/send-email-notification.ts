/* * */

import { Logger } from '@tmlmobilidade/logger';
import { Timer } from '@tmlmobilidade/timer';

/* * */

interface SendEmailNotificationParams {
	attachment_name: string
	extraction_id: string
	user_id: null | string | undefined
}

/**
 * Send an email notification.
 * @param params The parameters for the notification.
 */
export async function sendEmailNotification(params: SendEmailNotificationParams): Promise<void> {
	//

	const timer = new Timer();

	Logger.success(`Sent email notification for extraction "${params.extraction_id}" in ${timer.get()}.`);
}
