import type { NextConfig } from 'next';

import { Routes } from '@/lib/routes';

const nextConfig: NextConfig = {
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
