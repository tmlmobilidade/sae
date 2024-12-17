export const Routes = {

	API: {
		ALERTS: process.env.NEXT_PUBLIC_API_ALERTS_URL ?? 'https://alerts.carrismetropolitana.pt/api',
		CMET: process.env.NEXT_PUBLIC_CMET_API_URL ?? 'https://api.cmet.pt',
	},
};
