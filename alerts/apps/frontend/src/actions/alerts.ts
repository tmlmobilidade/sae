'use client';

import { getSessionCookie } from '@/components/authentication/actions/authentication';
import { Alert, CreateAlertDto, InsertOneResult, UpdateAlertDto, UpdateResult } from '@tmlmobilidade/services/types';
import { Routes } from '@/utils/routes';

const API_BASE_URL = Routes.API.ALERTS + '/alerts';

/**
 * Fetch all alerts.
 */
export const getAllAlerts = async (): Promise<Alert[]> => {
	const cookie = await getSessionCookie();

	const response = await fetch(API_BASE_URL, {
		headers: {
			// Include authentication tokens if necessary
			'Authorization': `Bearer ${cookie?.value}`,
		},
		method: 'GET',
	});
	return response.json();
};

/**
 * Fetch a single alert by ID.
 * @param id - The ID of the alert.
 */
export const getAlertById = async (id: string): Promise<Alert> => {
	const cookie = await getSessionCookie();

	const response = await fetch(`${API_BASE_URL}/${id}`, {
		headers: {
			// Include authentication tokens if necessary
			'Authorization': `Bearer ${cookie?.value}`,
		},
		method: 'GET',
	});
	return response.json();
};

/**
 * Create a new alert.
 * @param alertData - The data for the new alert.
 */
export const createAlert = async (alertData: CreateAlertDto): Promise<InsertOneResult<Alert>> => {
	const cookie = await getSessionCookie();

	const response = await fetch(API_BASE_URL, {
		body: JSON.stringify(alertData),
		headers: {
			'Content-Type': 'application/json',
			// Include authentication tokens if necessary
			'Authorization': `Bearer ${cookie?.value}`,
		},
		method: 'POST',
	});
	return response.json();
};

/**
 * Update an existing alert.
 * @param id - The ID of the alert to update.
 * @param alertData - The updated data for the alert.
 */
export const updateAlert = async (id: string, alertData: UpdateAlertDto): Promise<UpdateResult> => {
	const cookie = await getSessionCookie();

	const response = await fetch(`${API_BASE_URL}/${id}`, {
		body: JSON.stringify(alertData),
		headers: {
			'Content-Type': 'application/json',
			// Include authentication tokens if necessary
			'Authorization': `Bearer ${cookie?.value}`,
		},
		method: 'PUT',
	});
	return response.json();
};

/**
 * Delete an alert by ID.
 * @param id - The ID of the alert to delete.
 */
export const deleteAlert = async (id: string): Promise<{ message: string }> => {
	const cookie = await getSessionCookie();

	const response = await fetch(`${API_BASE_URL}/${id}`, {
		headers: {
			// Include authentication tokens if necessary
			'Authorization': `Bearer ${cookie?.value}`,
		},
		method: 'DELETE',
	});
	return response.json();
};
