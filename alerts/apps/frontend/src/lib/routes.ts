export const Routes = Object.freeze({
	CMET_API: process.env.NEXT_PUBLIC_CMET_API_URL ?? 'https://api.carrismetropolitana.pt/v2',
	ALERTS_API:  process.env.NEXT_PUBLIC_ALERTS_API_URL ?? 'http://localhost:5052',
	AUTH_API: process.env.NEXT_PUBLIC_AUTH_API_URL ?? 'http://localhost:3001',
	URL: process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000',
});
