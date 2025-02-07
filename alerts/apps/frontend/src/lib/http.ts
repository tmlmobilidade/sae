// "use client";

// Define the HttpResponse type
export interface HttpResponse<T> {
	data: null | T
	error: null | string
	status: number
}

// Create the fetchData function
export async function fetchData<T>(
	url: string,
	method: 'DELETE' | 'GET' | 'POST' | 'PUT' = 'GET',
	body?: unknown,
	headers: HeadersInit = {},
	options: Omit<RequestInit, 'body' | 'headers' | 'method'> = {},
): Promise<HttpResponse<T>> {
	try {
		const response = await fetch(url, {
			body: body ? JSON.stringify(body) : undefined,
			credentials: 'include',
			headers: {
				...(method === 'GET' || method === 'DELETE' || 'Content-Type' in headers ? {} : { 'Content-Type': 'application/json' }),
				...headers,
			},
			method,
			...options,
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				data: null,
				error: data.message || 'An error occurred',
				status: response.status,
			};
		}

		return {
			data,
			error: null,
			status: response.status,
		};
	}
	catch (error) {
		return {
			data: null,
			error: error instanceof Error ? error.message : 'Network error',
			status: 500,
		};
	}
}

export async function uploadFile(url: string, file: File) {
	try {
		const formData = new FormData();
		formData.append('file', file, file.name);

		const response = await fetch(url, {
			body: formData,
			credentials: 'include',
			method: 'POST',
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				data: null,
				error: data.message || 'An error occurred',
				status: response.status,
			};
		}

		return {
			data,
			error: null,
			status: response.status,
		};
	}
	catch (error) {
		return {
			data: null,
			error: error instanceof Error ? error.message : 'Network error',
			status: 500,
		};
	}
}

export const swrFetcher = async (url: string) => {
	const res = await fetch(url, { credentials: 'include' });
	const data = await res.json();

	if (!res.ok) {
		throw new Error(data.message);
	}

	return data;
};
