export const Routes = {

	API: {
		ALERTS: process.env.NEXT_PUBLIC_API_ALERTS_URL ?? 'http://localhost:5050',
		CMET: process.env.NEXT_PUBLIC_CMET_API_URL ?? 'https://api.cmet.pt',
	},
};
