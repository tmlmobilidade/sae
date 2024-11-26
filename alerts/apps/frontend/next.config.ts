import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	env: {
		API_ALERTS_URL: process.env.API_ALERTS_URL,
	},
};

export default nextConfig;
