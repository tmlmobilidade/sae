/* * */

import { type SendMailOptions } from 'nodemailer';

export interface SendEmailProps<T> {
	attachments?: SendMailOptions['attachments']
	data: T
	to: string | string[]
}
