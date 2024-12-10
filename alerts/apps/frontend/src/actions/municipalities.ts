import { Municipality } from '@tmlmobilidade/services/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_CMET_API_URL + '/locations/municipalities';

/**
 * Helper function to handle HTTP responses.
 * @param response - The fetch response object.
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || 'An error occurred');
	}

	return response.json();
};

/**
 * Fetch all municipalities.
 */
export const getAllMunicipalities = async (): Promise<Municipality[]> => {
	const response = await fetch(API_BASE_URL, {
		headers: {
			'Content-Type': 'application/json',
			// Include authentication tokens if necessary
			// 'Authorization': `Bearer ${token}`,
		},
		method: 'GET',
	});
	return handleResponse<Municipality[]>(response);
};

/**
 * Fetch a single Municipality by ID.
 * @param id - The ID of the Municipality.
 */
export const getMunicipalityById = async (id: string): Promise<Municipality> => {
	const response = await fetch(`${API_BASE_URL}/${id}`, {
		headers: {
			'Content-Type': 'application/json',
			// Include authentication tokens if necessary
			// 'Authorization': `Bearer ${token}`,
		},
		method: 'GET',
	});
	return handleResponse<Municipality>(response);
};

/**
 * Create a new Municipality.
 * @param MunicipalityData - The data for the new Municipality.
 */
export const createMunicipality = async (municipalityData: Partial<Municipality>): Promise<Municipality> => {
	const response = await fetch(API_BASE_URL, {
		body: JSON.stringify(municipalityData),
		headers: {
			'Content-Type': 'application/json',
			// Include authentication tokens if necessary
			// 'Authorization': `Bearer ${token}`,
		},
		method: 'POST',
	});
	return handleResponse<Municipality>(response);
};

/**
 * Update an existing Municipality.
 * @param id - The ID of the Municipality to update.
 * @param MunicipalityData - The updated data for the Municipality.
 */
export const updateMunicipality = async (id: string, municipalityData: Partial<Municipality>): Promise<Municipality> => {
	const response = await fetch(`${API_BASE_URL}/${id}`, {
		body: JSON.stringify(municipalityData),
		headers: {
			'Content-Type': 'application/json',
			// Include authentication tokens if necessary
			// 'Authorization': `Bearer ${token}`,
		},
		method: 'PUT',
	});
	return handleResponse<Municipality>(response);
};

/**
 * Delete an Municipality by ID.
 * @param id - The ID of the Municipality to delete.
 */
export const deleteMunicipality = async (id: string): Promise<{ message: string }> => {
	const response = await fetch(`${API_BASE_URL}/${id}`, {
		headers: {
			'Content-Type': 'application/json',
			// Include authentication tokens if necessary
			// 'Authorization': `Bearer ${token}`,
		},
		method: 'DELETE',
	});
	return handleResponse<{ message: string }>(response);
};
