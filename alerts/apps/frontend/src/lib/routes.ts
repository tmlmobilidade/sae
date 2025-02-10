export const PageRoutes = Object.freeze({
	ALERT_DETAIL: (id: string) => `/alerts/${id}`,
	ALERT_IMAGE: (id: string) => `/alerts/${id}/image`,
	ALERT_LIST: '/alerts',
});

export const ApiRoutes = Object.freeze({
	ALERTS_API: process.env.NEXT_PUBLIC_ALERTS_API_URL ?? 'https://alerts.sae.carrismetropolitana.pt/api',
	AUTH_API: process.env.NEXT_PUBLIC_AUTH_API_URL ?? 'https://auth.sae.carrismetropolitana.pt',
	CMET_API: process.env.NEXT_PUBLIC_CMET_API_URL ?? 'https://api.carrismetropolitana.pt/v2',
});

export const Routes = Object.freeze({
	URL: process.env.NEXT_PUBLIC_URL ?? 'https://alerts.sae.carrismetropolitana.pt',
	...PageRoutes,
	...ApiRoutes,
});
