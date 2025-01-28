/* * */

import '@tmlmobilidade/ui/dist/styles.css';
// import './reset.css';
import { ThemeProvider } from '@tmlmobilidade/ui';
import { Inter } from 'next/font/google';
import { cookies as nextCookies } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';
import { LinesContextProvider } from '@/contexts/Lines.context';
import { StopsContextProvider } from '@/contexts/Stops.context';
import { DataProviders } from '@/components/providers/data-providers';
import { ConfigProviders } from '@/components/providers/config-providers';

/* * */

const inter = Inter({
	subsets: ['latin'],
});

/* * */

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	const cookies = await nextCookies();
	const sessionToken = cookies.get('session_token')?.value;

	if (!sessionToken) {
		redirect(
			`http://localhost:3000/login?redirect=http%3A%2F%2Flocalhost%3A3001`,
			RedirectType.replace
		);
	}

	return (
		<html className={inter.className} lang="en" suppressHydrationWarning>
			<body>
				<ThemeProvider initialTheme="ocean">
					<ConfigProviders>
						<DataProviders>{children}</DataProviders>
					</ConfigProviders>
				</ThemeProvider>
			</body>
		</html>
	);
}
