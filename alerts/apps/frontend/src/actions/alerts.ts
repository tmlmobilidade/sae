import { Alert, CreateAlertDto, InsertOneResult, UpdateAlertDto, UpdateResult } from '@tmlmobilidade/services/types';

const API_BASE_URL = process.env.API_ALERTS_URL + '/alerts';

interface HTTPResponse<T> {
	data: T
	message: string
}

/**
 * Helper function to handle HTTP responses.
 * @param response - The fetch response object.
 */
const handleResponse = async <T>(response: Response): Promise<HTTPResponse<T>> => {
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || 'An error occurred');
	}
	return response.json();
};

/**
 * Fetch all alerts.
 */
export const getAllAlerts = async (): Promise<HTTPResponse<Alert[]>> => {
	const response = await fetch(API_BASE_URL, {
		headers: {
			// Include authentication tokens if necessary
			// 'Authorization': `Bearer ${token}`,
		},
		method: 'GET',
	});
	return handleResponse<Alert[]>(response);
};

/**
 * Fetch a single alert by ID.
 * @param id - The ID of the alert.
 */
export const getAlertById = async (id: string): Promise<HTTPResponse<Alert>> => {
	const response = await fetch(`${API_BASE_URL}/${id}`, {
		headers: {
			// Include authentication tokens if necessary
			// 'Authorization': `Bearer ${token}`,
		},
		method: 'GET',
	});
	return handleResponse<Alert>(response);
};

/**
 * Create a new alert.
 * @param alertData - The data for the new alert.
 */
export const createAlert = async (alertData: CreateAlertDto): Promise<HTTPResponse<InsertOneResult<Alert>>> => {
	const response = await fetch(API_BASE_URL, {
		body: JSON.stringify(alertData),
		headers: {
			'Content-Type': 'application/json',
			// Include authentication tokens if necessary
			// 'Authorization': `Bearer ${token}`,
		},
		method: 'POST',
	});
	return handleResponse<InsertOneResult<Alert>>(response);
};

/**
 * Update an existing alert.
 * @param id - The ID of the alert to update.
 * @param alertData - The updated data for the alert.
 */
export const updateAlert = async (id: string, alertData: UpdateAlertDto): Promise<HTTPResponse<UpdateResult>> => {
	const response = await fetch(`${API_BASE_URL}/${id}`, {
		body: JSON.stringify(alertData),
		headers: {
			'Content-Type': 'application/json',
			// Include authentication tokens if necessary
			// 'Authorization': `Bearer ${token}`,
		},
		method: 'PUT',
	});
	return handleResponse<UpdateResult>(response);
};

/**
 * Delete an alert by ID.
 * @param id - The ID of the alert to delete.
 */
export const deleteAlert = async (id: string): Promise<HTTPResponse<{ message: string }>> => {
	const response = await fetch(`${API_BASE_URL}/${id}`, {
		headers: {
			// Include authentication tokens if necessary
			// 'Authorization': `Bearer ${token}`,
		},
		method: 'DELETE',
	});
	return handleResponse<{ message: string }>(response);
};
