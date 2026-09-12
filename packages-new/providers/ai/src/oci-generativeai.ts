/* * */

import { readFileSync } from 'node:fs';
import { NoRetryConfigurationDetails, Region, SimpleAuthenticationDetailsProvider } from 'oci-common';
import { GenerativeAiInferenceClient, requests } from 'oci-generativeaiinference';

import { availableAiModels } from './models.js';

/**
 * This is a simple wrapper around the OCI Generative AI SDK to make it easier
 * to use in our application. It currently only supports running a text prompt
 * through the "openai.gpt-oss-120b" model and getting a response.
 */
export interface OCIGenerativeAIRunOptions {
	temperature?: number
}

export class OCIGenerativeAIProvider {
	//

	private readonly ociClient: GenerativeAiInferenceClient;

	constructor() {
		//

		//
		// Validate that all required environment variables are set

		if (!process.env.OCI_AI_FINGERPRINT) throw new Error('Missing OCI_AI_FINGERPRINT environment variable for OCI Generative AI Provider');
		if (!process.env.OCI_AI_PRIVATE_KEY_PATH && !process.env.OCI_AI_PRIVATE_KEY) throw new Error('Missing OCI_AI_PRIVATE_KEY_PATH or OCI_AI_PRIVATE_KEY environment variable for OCI Generative AI Provider');
		if (!process.env.OCI_AI_REGION) throw new Error('Missing OCI_AI_REGION environment variable for OCI Generative AI Provider');
		if (!process.env.OCI_AI_TENANCY) throw new Error('Missing OCI_AI_TENANCY environment variable for OCI Generative AI Provider');
		if (!process.env.OCI_AI_USER) throw new Error('Missing OCI_AI_USER environment variable for OCI Generative AI Provider');
		if (!process.env.OCI_AI_COMPARTMENT) throw new Error('Missing OCI_AI_COMPARTMENT environment variable for OCI Generative AI Provider');

		//
		// Resolve private key

		const privateKeyPath = process.env.OCI_AI_PRIVATE_KEY_PATH;
		const privateKeyValue = process.env.OCI_AI_PRIVATE_KEY;
		if (!privateKeyPath && !privateKeyValue) throw new Error('OCI_AI_PRIVATE_KEY or OCI_AI_PRIVATE_KEY_PATH is not set');

		let privateKey: string;
		if (privateKeyPath) privateKey = readFileSync(privateKeyPath, 'utf8');
		else if (privateKeyValue) privateKey = privateKeyValue.replace(/\\n/g, '\n');
		else throw new Error('Could not resolve private key for OCI Generative AI Provider (missing OCI_AI_PRIVATE_KEY or OCI_AI_PRIVATE_KEY_PATH)');

		//
		// Build the OCI client using the environment variables for authentication

		this.ociClient = new GenerativeAiInferenceClient({
			authenticationDetailsProvider: new SimpleAuthenticationDetailsProvider(
				process.env.OCI_AI_TENANCY,
				process.env.OCI_AI_USER,
				process.env.OCI_AI_FINGERPRINT,
				privateKey,
				null,
				Region.fromRegionId(process.env.OCI_AI_REGION),
			),
		});
		this.ociClient.endpoint = `https://inference.generativeai.${process.env.OCI_AI_REGION}.oci.oraclecloud.com`;
	}

	/**
	 * Runs a prompt through the OCI Generative AI service and returns the response.
	 * This is using the "openai.gpt-oss-120b" model, which is a 120B parameter model
	 * based on the open source Falcon-40B-Instruct-v2 architecture,
	 * but with more parameters and trained on more data.
	 * @param prompt The prompt to run through the model.
	 * @param options Optional generation parameters (defaults match the OCI SDK baseline).
	 * @returns The response from the model.
	 */
	async run(prompt: string, options?: OCIGenerativeAIRunOptions): Promise<string> {
		//

		//
		// Build the chat request, in the most complicated way possible
		// because the OCI SDK is a nightmare to work with.
		// (This was written by AI, I swear.)

		const chatRequest: requests.ChatRequest = {
			chatDetails: {
				chatRequest: {
					apiFormat: 'GENERIC',
					frequencyPenalty: 0,
					maxTokens: 2048,
					messages: [
						{
							content: [
								{
									// @ts-expect-error — OMG this has to be the most convoluted way to send
									// a simple text message I've ever seen in my life.
									text: prompt,
									type: 'TEXT',
								},
							],
							role: 'USER',
						},
					],
					presencePenalty: 0,
					temperature: options?.temperature ?? 0,
					topK: 1,
					topP: 0.95,
				},
				compartmentId: process.env.OCI_AI_COMPARTMENT || '-',
				servingMode: {
					modelId: availableAiModels['google.gemini-2.5-flash'].ocid,
					servingType: 'ON_DEMAND',
				},
			},
			retryConfiguration: NoRetryConfigurationDetails,
		};

		//
		// Send the chat request and return the response.
		// Again, this is the most convoluted way to get a simple text response from the model.

		const chatResponse = await this.ociClient.chat(chatRequest);

		if (!chatResponse || !('chatResult' in chatResponse)) {
			throw new Error('Invalid response from OCI Generative AI service: ' + JSON.stringify(chatResponse));
		}

		if (!('choices' in chatResponse.chatResult.chatResponse)) {
			throw new Error('Invalid response from OCI Generative AI service: ' + JSON.stringify(chatResponse));
		}

		// @ts-expect-error — Yes, I know this is a nightmare to read,
		// but this is the documented way to get the text response from the model.
		return chatResponse.chatResult.chatResponse.choices[0].message.content[0].text;

		//
	}

	//
}
