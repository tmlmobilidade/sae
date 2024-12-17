import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	output: 'standalone',
	env: {
		API_ALERTS_URL: process.env.API_ALERTS_URL,
		NEXT_PUBLIC_CMET_API_URL: process.env.NEXT_PUBLIC_CMET_API_URL,
	},
};

export default nextConfig;
