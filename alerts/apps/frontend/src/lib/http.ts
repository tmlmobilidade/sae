// "use client";

// Define the HttpResponse type
export type HttpResponse<T> = {
	data: T | null;
	error: string | null;
	status: number;
};

// Create the fetchData function
export async function fetchData<T>(
	url: string,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
	body?: any,
	headers: HeadersInit = {},
	options: Omit<RequestInit, 'method' | 'body' | 'headers'> = {}
): Promise<HttpResponse<T>> {

	try {
		const response = await fetch(url, {
			method,
			headers: {
				...(method === 'GET' ? {} : { 'Content-Type': 'application/json' }),
				...headers,
			},
			credentials: 'include',
			body: body ? JSON.stringify(body) : undefined,
			...options,
		});

		const data = await response.json();

		if (!response.ok) {
			console.log("data", data);
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
	} catch (error) {
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
