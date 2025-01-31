/* * */

import { type NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

/* * */

const nextConfig: NextConfig = {
	output: 'standalone',
	reactStrictMode: true,
};

/* * */

export default createNextIntlPlugin()(nextConfig);
