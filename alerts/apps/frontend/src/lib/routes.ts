export const PageRoutes = Object.freeze({
	ALERT_LIST: '/alerts',
	ALERT_DETAIL: (id: string) => `/alerts/${id}`,
});

export const ApiRoutes = Object.freeze({
	CMET_API: process.env.NEXT_PUBLIC_CMET_API_URL ?? 'https://api.carrismetropolitana.pt/v2',
	ALERTS_API:  process.env.NEXT_PUBLIC_ALERTS_API_URL ?? 'http://localhost:5052',
	AUTH_API: process.env.NEXT_PUBLIC_AUTH_API_URL ?? 'http://localhost:3001',
});

export const Routes = Object.freeze({
	URL: process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000',
	...PageRoutes,
	...ApiRoutes,
});
