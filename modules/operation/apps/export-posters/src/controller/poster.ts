/* * */

import parametersConfig from '@/parameters.json' with { type: 'json' };
import { type ExportToHitouchConfig } from '@/types.js';
import fs from 'node:fs';
import path from 'node:path';

interface TokenResponse {
	access_token: string
	expires_in: number
}

export interface PDFStatus {
	downloadLink?: string
	status: string
}

/* * */

function getRequiredEnv(name: string): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

/* * */

export class PostersController {
	private accessToken: null | string = null;
	private tokenExpiresAt = 0;

	/**
	 * Returns a valid access token, requesting a new one when needed.
	 */
	async generateToken(): Promise<string> {
		//

		//
		// Reuse the current token while it is still valid.

		if (this.accessToken && Date.now() < this.tokenExpiresAt) {
			return this.accessToken;
		}

		//
		// Request a new token from the API.

		const body = new URLSearchParams({
			client_id: getRequiredEnv('CLIENT_ID'),
			client_secret: getRequiredEnv('CLIENT_SECRET'),
			grant_type: 'client_credentials',
			scope: getRequiredEnv('ZPHERES_API_SCOPE'),
		});

		const response = await fetch(getRequiredEnv('ZPHERES_API_TOKEN_URL'), {
			body,
			method: 'POST',
		});

		if (!response.ok) {
			const responseBody = await response.text();
			throw new Error(`Token request failed (${response.status}): ${responseBody.slice(0, 1_000)}`);
		}

		const tokenData = await response.json() as TokenResponse;

		if (!tokenData.access_token || !tokenData.expires_in) {
			throw new Error('Token response is missing access_token or expires_in.');
		}

		//
		// Refresh one minute before expiry to avoid using a token while it expires.

		this.accessToken = tokenData.access_token;
		this.tokenExpiresAt = Date.now() + Math.max(tokenData.expires_in - 60, 0) * 1_000;

		return this.accessToken;
	}

	/**
	 * Creates a new poster in the API.
	 */
	async generatePDF(exportConfig: ExportToHitouchConfig): Promise<string> {
		//

		//
		// Generate a new access token

		const accessToken = await this.generateToken();
		const gtfsZipPath = path.resolve(exportConfig.workdir, exportConfig.output);

		//
		// Verify the HiTouch ZIP file exists and is not empty

		if (!fs.existsSync(gtfsZipPath)) {
			throw new Error(`HiTouch ZIP file does not exist: ${gtfsZipPath}`);
		}

		//
		// Verify the HiTouch ZIP file is not empty

		const gtfsZipSize = fs.statSync(gtfsZipPath).size;

		if (gtfsZipSize === 0) {
			throw new Error(`HiTouch ZIP file is empty: ${gtfsZipPath}`);
		}

		//
		// Read the HiTouch ZIP file and parameters

		const gtfsZip = await fs.promises.readFile(gtfsZipPath);
		const parameters = JSON.stringify(parametersConfig);

		const body = new FormData();

		//
		// Append the HiTouch ZIP file and parameters to the request body

		body.append('gtfs.zip', new Blob([new Uint8Array(gtfsZip)], { type: 'application/zip' }), path.basename(gtfsZipPath));
		body.append('parameters.json', new Blob([parameters], { type: 'application/json' }), 'parameters.json');

		//
		// Send the request to the API

		const response = await fetch(getRequiredEnv('ZPHERES_GENERATE_SVG_URL'), {
			body,
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'ob2zphrs-customer': getRequiredEnv('OB_CUSTOMER'),
				'ob2zphrs-user': getRequiredEnv('OB_USER'),
			},
			method: 'POST',
		});

		if (!response.ok) {
			const responseBody = await response.text();

			throw new Error(`PDF generation failed (${response.status}): ${responseBody.slice(0, 1_000)}`);
		}

		const location = response.headers.get('location');
		const match = location?.match(/\/api\/svg\/([^?#/]+)/);
		const pdfId = match ? match[1] : null;

		if (!pdfId) {
			throw new Error('PDF response has an invalid location header: ' + (location ?? 'missing'));
		}

		return pdfId;
	}

	/**
	 * Gets the status of a PDF generation in the API.
	 */
	async getPDFStatus(id: string): Promise<PDFStatus> {
		//

		const accessToken = await this.generateToken();
		const response = await fetch(getRequiredEnv('ZPHERES_SVG_STATUS_URL').replace(':id', id), {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'ob2zphrs-customer': getRequiredEnv('OB_CUSTOMER'),
				'ob2zphrs-user': getRequiredEnv('OB_USER'),
			},
		});

		if (!response.ok) {
			const responseBody = await response.text();
			throw new Error(`PDF status failed (${response.status}): ${responseBody.slice(0, 1_000)}`);
		}

		const responseData: unknown = await response.json();

		if (!responseData || typeof responseData !== 'object') {
			throw new Error('PDF status response is missing a valid status.');
		}

		const { downloadLink, status } = responseData as Record<string, unknown>;

		if (typeof status !== 'string') {
			throw new Error('PDF status response is missing a valid status.');
		}

		if (downloadLink !== undefined && typeof downloadLink !== 'string') {
			throw new Error('PDF status response has an invalid download URL.');
		}

		return {
			downloadLink: typeof downloadLink === 'string' ? downloadLink : undefined,
			status,
		};
	}

	/**
	 * Downloads the generated posters ZIP file from the API.
	 */
	async downloadPDF(fileUrl: string): Promise<Buffer> {
		//

		const response = await fetch(fileUrl);

		if (!response.ok) {
			const responseBody = await response.text();
			throw new Error(`PDF download failed (${response.status}): ${responseBody.slice(0, 1_000)}`);
		}

		return Buffer.from(await response.arrayBuffer());
	}
}
