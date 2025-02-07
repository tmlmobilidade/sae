import type { NextConfig } from 'next';

import { Routes } from '@/lib/routes';

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				hostname: '*.carrismetropolitana.pt',
			},
			{
				hostname: '*.cloudflarestorage.com',
			},
		],
	},
	async redirects() {
		return [
			{
				destination: Routes.ALERT_LIST,
				permanent: true,
				source: '/',
			},
		];
	},
};

export default nextConfig;
