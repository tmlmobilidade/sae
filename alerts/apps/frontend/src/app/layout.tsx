/* * */
import { ConfigProviders } from '@/providers/client-providers';
import { GlobalProviders } from '@/providers/global-providers';
import { Inter } from 'next/font/google';

/* * */

const inter = Inter({
	display: 'swap',
	subsets: ['latin'],
	variable: '--font-inter',
	weight: ['500', '600', '700', '800'],
});

/* * */

export const metadata = {
	description: 'Gestão de Alertas',
	metadataBase: process.env.VERCEL_URL ? new URL(`https://${process.env.VERCEL_URL}`) : new URL(`http://0.0.0.0:${process.env.PORT || 3000}`),
	title: 'TML - Alertas',
};

/* * */

export default async function RootLayout({ children }) {
	//

	//
	// A. Fetch data

	//
	// B. Render components

	return (
		<html className={inter.variable}>
			<head>
				<meta content="transparent" name="theme-color" />
			</head>
			<body>
				<GlobalProviders>
					<ConfigProviders>{children}</ConfigProviders>
				</GlobalProviders>
			</body>
		</html>
	);

	//
}
