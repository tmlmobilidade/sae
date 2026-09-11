/* * */

import { asyncSingletonProxy } from '@tmlmobilidade/utils';
import nodemailer from 'nodemailer';

/* * */

interface RefreshToken {
	expiresAt: number | undefined
	token: string | undefined
}

interface RefreshTokenResponse {
	access_token: string
	expires_in: number
	token_type: string
}

export class EmailProvider {
	//

	private static _instance: EmailProvider;

	private _refreshToken: RefreshToken = { expiresAt: undefined, token: undefined };
	private _smtpTransporter: nodemailer.Transporter;

	/**
	 * Return the instance of the EmailProvider.
	 */
	public static async getInstance() {
		if (!EmailProvider._instance) {
			const instance = new EmailProvider();
			await instance.connect();
			EmailProvider._instance = instance;
		}
		return EmailProvider._instance;
	}

	/**
	 * Connect to the SMTP server and return the transporter instance.
	 */
	async connect(): Promise<nodemailer.Transporter> {
		try {
			// Check for required environment variables
			if (!process.env.TML_PROVIDER_EMAIL_SERVER_HOST) throw new Error('Missing required environment variable: TML_PROVIDER_EMAIL_SERVER_HOST');
			if (!process.env.TML_PROVIDER_EMAIL_SERVER_PORT) throw new Error('Missing required environment variable: TML_PROVIDER_EMAIL_SERVER_PORT');
			if (!process.env.TML_PROVIDER_EMAIL_AUTH_CLIENT_ID) throw new Error('Missing required environment variable: TML_PROVIDER_EMAIL_AUTH_CLIENT_ID');
			if (!process.env.TML_PROVIDER_EMAIL_AUTH_CLIENT_SECRET) throw new Error('Missing required environment variable: TML_PROVIDER_EMAIL_AUTH_CLIENT_SECRET');
			if (!process.env.TML_PROVIDER_EMAIL_AUTH_ACCESS_URL) throw new Error('Missing required environment variable: TML_PROVIDER_EMAIL_AUTH_ACCESS_URL');
			if (!process.env.TML_PROVIDER_EMAIL_AUTH_USER) throw new Error('Missing required environment variable: TML_PROVIDER_EMAIL_AUTH_USER');
			if (!process.env.TML_PROVIDER_EMAIL_FROM) throw new Error('Missing required environment variable: TML_PROVIDER_EMAIL_FROM');
			const accessToken = await this.getRefreshToken();
			if (!accessToken) throw new Error('Failed to get refresh token');
			// Connect to the SMTP server
			this._smtpTransporter = this.createSmtpTransporter(accessToken);
			return this._smtpTransporter;
		} catch (error) {
			throw new Error('Error connecting to SMTP server', { cause: error });
		}
	}

	/**
	 * Send an email.
	 * @param emailOptions - The email options.
	 * @returns A promise that resolves when the email is sent.
	 */
	async send(sendMailOptions: nodemailer.SendMailOptions) {
		try {
			const currentAccessToken = this._refreshToken.token;
			const accessToken = await this.getRefreshToken();
			if (!accessToken) throw new Error('Failed to get refresh token');
			if (accessToken !== currentAccessToken) this._smtpTransporter = this.createSmtpTransporter(accessToken);
			await this._smtpTransporter.sendMail({
				...this._smtpTransporter.options,
				...sendMailOptions,
			});
		} catch (error) {
			throw new Error('Error sending email', { cause: error });
		}
	}

	/**
	 * Create an SMTP transporter with the current OAuth2 access token.
	 */
	private createSmtpTransporter(accessToken: string): nodemailer.Transporter {
		return nodemailer.createTransport({
			auth: {
				accessToken,
				accessUrl: process.env.TML_PROVIDER_EMAIL_AUTH_ACCESS_URL,
				clientId: process.env.TML_PROVIDER_EMAIL_AUTH_CLIENT_ID,
				clientSecret: process.env.TML_PROVIDER_EMAIL_AUTH_CLIENT_SECRET,
				type: 'OAuth2',
				user: process.env.TML_PROVIDER_EMAIL_AUTH_USER,
			},
			from: process.env.TML_PROVIDER_EMAIL_FROM,
			host: process.env.TML_PROVIDER_EMAIL_SERVER_HOST,
			port: Number(process.env.TML_PROVIDER_EMAIL_SERVER_PORT),
		});
	}

	/**
	 * Fetch and cache the Microsoft OAuth2 access token.
	 */
	private async getRefreshToken() {
		// Check for required environment variables
		if (!process.env.TML_PROVIDER_EMAIL_AUTH_CLIENT_ID) throw new Error('Missing required environment variable: TML_PROVIDER_EMAIL_AUTH_CLIENT_ID');
		if (!process.env.TML_PROVIDER_EMAIL_AUTH_CLIENT_SECRET) throw new Error('Missing required environment variable: TML_PROVIDER_EMAIL_AUTH_CLIENT_SECRET');
		if (!process.env.TML_PROVIDER_EMAIL_AUTH_ACCESS_URL) throw new Error('Missing required environment variable: TML_PROVIDER_EMAIL_AUTH_ACCESS_URL');
		// Return the cached token if it is still valid
		if (this._refreshToken.token && this._refreshToken.expiresAt && this._refreshToken.expiresAt > Date.now()) return this._refreshToken.token;
		// Fetch the new token
		const requestBody = new URLSearchParams({
			client_id: process.env.TML_PROVIDER_EMAIL_AUTH_CLIENT_ID,
			client_secret: process.env.TML_PROVIDER_EMAIL_AUTH_CLIENT_SECRET,
			grant_type: 'client_credentials',
			scope: 'https://outlook.office365.com/.default',
		}).toString();

		const response = await fetch(process.env.TML_PROVIDER_EMAIL_AUTH_ACCESS_URL, {
			body: requestBody,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			method: 'POST',
		});

		const responseText = await response.text();

		if (!response.ok) {
			throw new Error(`Token request failed (${response.status}): ${responseText.slice(0, 500)}`);
		}

		const data = JSON.parse(responseText) as RefreshTokenResponse;

		this._refreshToken = {
			expiresAt: Date.now() + (data.expires_in * 1000),
			token: data.access_token,
		};

		return this._refreshToken.token;
	}

	//
}

export const emailProvider = asyncSingletonProxy(EmailProvider);
