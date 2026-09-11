/* * */

import { type GtfsRtFeedMessage } from '@tmlmobilidade/go-types-gtfs-rt';
import { UnixSecondsSchema } from '@tmlmobilidade/go-types-shared';
import { type ServiceAlertResponse } from '@tmlmobilidade/types';
import { IncomingMessage } from 'node:http';
import https from 'node:https';

import { mlAuthClient } from './auth.js';
import { BaseResponse, EstadoLinha, InfoEstacao, TempoEsperaRawItem } from './types.js';

/* * */

const BASE_URL = process.env.ML_API_URL;
const ALERTS_URL = process.env.ML_ALERTS_URL;

async function fetcher<T>(endpoint: string): Promise<T> {
	if (!BASE_URL) {
		throw new Error('Missing ML_API_URL environment variable.');
	}

	const apiToken = await mlAuthClient.getToken();
	return await new Promise<T>((resolve, reject) => {
		//

		const requestOptions: https.RequestOptions = {
			allowPartialTrustChain: true,
			headers: {
				Authorization: `Bearer ${apiToken}`,
			},
			hostname: 'api.metrolisboa.pt',
			method: 'GET',
			path: `/estadoServicoML/1.0.1${endpoint}`,
			port: 8243,
			rejectUnauthorized: false,
			servername: 'api.metrolisboa.pt',
		};

		const callback: (res: IncomingMessage) => void = (response) => {
			const chunks: Buffer[] = [];
			response.on('data', chunk => chunks.push(chunk));
			response.on('end', () => {
				const responseText = Buffer.concat(chunks).toString('utf8');
				if (response.statusCode < 200 || response.statusCode >= 300) {
					reject(new Error(`[MlClient] Request failed (${response.statusCode}): ${responseText.slice(0, 500)}`));
					return;
				}
				try {
					resolve(JSON.parse(responseText));
				} catch {
					reject(new Error(`[MlClient] Response is not JSON: ${responseText.slice(0, 500)}`));
				}
			});
		};

		const request = https.request(requestOptions, callback);

		request.on('error', reject);
		request.end();
	});
}

/* * */

const endpoints = {
	estadoLinha: (linha: string) => `/estadoLinha/${linha}`,
	estadoLinhaTodas: '/estadoLinha/todos',
	infoEstacao: (estacao: string) => `/infoEstacao/${estacao}`,
	infoEstacaoTodas: '/infoEstacao/todos',
	serviceAlerts: ALERTS_URL,
	tempoEsperaEstacao: (estacao: string) => `/tempoEspera/Estacao/${estacao}`,
	tempoEsperaLinha: (linha: string) => `/tempoEspera/Linha/${linha}`,
	tempoEsperaTodasEstacoes: '/tempoEspera/Estacao/todos',
} as const;

export const MlClient = Object.freeze({

	/**
	 * Gets the status of a specific Metro Lisboa line.
	 * @param linha Line identifier as string.
	 * @returns EstadoLinha object with the current status of the line.
	 */
	estadoLinha: async (linha: string): Promise<BaseResponse<EstadoLinha>> => {
		return await fetcher<BaseResponse<EstadoLinha>>(endpoints.estadoLinha(linha));
	},

	/**
	 * Gets the status of all Metro Lisboa lines.
	 * @returns An array of EstadoLinha objects, each representing the status of a line.
	 */
	estadoLinhaTodas: async (): Promise<BaseResponse<EstadoLinha[]>> => {
		return await fetcher<BaseResponse<EstadoLinha[]>>(endpoints.estadoLinhaTodas);
	},

	/**
	 * Gets information about a specific Metro Lisboa station.
	 * @param estacao Station identifier as string.
	 * @returns InfoEstacao object with details about the station.
	 */
	infoEstacao: async (estacao: string): Promise<BaseResponse<InfoEstacao>> => {
		return await fetcher<BaseResponse<InfoEstacao>>(endpoints.infoEstacao(estacao));
	},

	/**
	 * Gets information about all Metro Lisboa stations.
	 * @returns An array of InfoEstacao objects, one for each station.
	 */
	infoEstacaoTodas: async (): Promise<BaseResponse<InfoEstacao[]>> => {
		return await fetcher<BaseResponse<InfoEstacao[]>>(endpoints.infoEstacaoTodas);
	},

	/**
	 * Retrieves current Metro Lisboa service alerts.
	 * @returns A ServiceAlertResponse containing the active service alerts in GTFS-realtime format.
	 */
	serviceAlerts: async (): Promise<BaseResponse<ServiceAlertResponse>> => {
		return await fetcher<BaseResponse<ServiceAlertResponse>>(endpoints.serviceAlerts);
	},

	/**
	 * Gets the current waiting time estimates for a specific station.
	 * @param estacao Station identifier as string.
	 * @returns An array of TempoEsperaRawItem objects, one for each platform in the station.
	 */
	tempoEsperaEstacao: async (estacao: string): Promise<BaseResponse<TempoEsperaRawItem[]>> => {
		return await fetcher<BaseResponse<TempoEsperaRawItem[]>>(endpoints.tempoEsperaEstacao(estacao));
	},

	/**
	 * Gets the current waiting time estimates for a specific line.
	 * @param linha Line identifier as string.
	 * @returns An array of TempoEsperaRawItem objects, one for each platform in the line.
	 */
	tempoEsperaLinha: async (linha: string): Promise<BaseResponse<TempoEsperaRawItem[]>> => {
		return await fetcher<BaseResponse<TempoEsperaRawItem[]>>(endpoints.tempoEsperaLinha(linha));
	},

	/**
	 * Gets the current waiting time estimates for all stations.
	 * @returns An array of TempoEsperaRawItem objects, one for each platform in all stations.
	 */
	tempoEsperaTodasEstacoes: async (): Promise<BaseResponse<TempoEsperaRawItem[]>> => {
		return await fetcher<BaseResponse<TempoEsperaRawItem[]>>(endpoints.tempoEsperaTodasEstacoes);
	},

	/**
	 * Fetches waiting time estimates for a line and transforms them into a GTFS-RT TripUpdates feed.
	 * @param linha Line identifier as string.
	 * @returns A GtfsRtFeedMessage containing TripUpdates.
	 */
	tripUpdates: async (): Promise<GtfsRtFeedMessage> => {
		const now = Date.now();

		// const lines = ['Amarela', 'Azul', 'Verde', 'Vermelha'];
		const entities: GtfsRtFeedMessage['entity'] = [];
		// for (const line of lines) {
		// 	// const data = await fetcher<BaseResponse<TempoEsperaRawItem[]>>(endpoints.tempoEsperaLinha(line));

		// 	// const trainStops = new Map<string, { destination: string, stops: Array<{ arrival_seconds: number, stop_id: string, stop_sequence: number }> }>();

		// 	// for (const [index, item] of data.resposta.entries()) {
		// 	// 	const trains = [
		// 	// 		{ comboio: item.comboio, tempo: item.tempoChegada1 },
		// 	// 		{ comboio: item.comboio2, tempo: item.tempoChegada2 },
		// 	// 		{ comboio: item.comboio3, tempo: item.tempoChegada3 },
		// 	// 	];

		// 	// 	for (const train of trains) {
		// 	// 		if (!train.comboio || train.tempo === '--') continue;
		// 	// 		const arrivalSeconds = Number.parseInt(train.tempo, 10);
		// 	// 		if (!trainStops.has(train.comboio)) {
		// 	// 			trainStops.set(train.comboio, { destination: item.destino, stops: [] });
		// 	// 		}
		// 	// 		// trainStops.get(train.comboio)!.stops.push({
		// 	// 		// 	arrival_seconds: arrivalSeconds,
		// 	// 		// 	stop_id: item.stop_id,
		// 	// 		// 	stop_sequence: index,
		// 	// 		// });
		// 	// 	}
		// 	// }

		// 	// entities.push(...Array.from(trainStops.entries()).map(([key, value]) => {
		// 	// 	const sortedStops = value.stops.sort((a, b) => a.stop_sequence - b.stop_sequence);
		// 	// 	return {
		// 	// 		id: `${line}_${key}_${DESTINATION_MAP[value.destination].code}`,
		// 	// 		trip_update: {
		// 	// 			stop_time_update: sortedStops.map(stop => ({
		// 	// 				arrival: {
		// 	// 					time: now + stop.arrival_seconds * 1000,
		// 	// 				},
		// 	// 				stop_id: stop.stop_id,
		// 	// 				stop_sequence: stop.stop_sequence,
		// 	// 			})),
		// 	// 			timestamp: now,
		// 	// 			trip: {
		// 	// 				line_id: line,
		// 	// 				line_short_name: `${line}_${DESTINATION_MAP[value.destination].code}`,
		// 	// 				trip_headsign: DESTINATION_MAP[value.destination].name,
		// 	// 				trip_id: `${line}_${key}_${value.destination}`,
		// 	// 			},
		// 	// 			vehicle: {
		// 	// 				id: key,
		// 	// 			},
		// 	// 		},
		// 	// 	};
		// 	// }));
		// }

		return {
			entity: entities,
			header: {
				gtfs_realtime_version: '2.0',
				incrementality: 'FULL_DATASET',
				timestamp: UnixSecondsSchema.parse(now / 100),
			},
		};
	},

}) satisfies Record<keyof typeof endpoints, (...args: any[]) => Promise<unknown>>;
