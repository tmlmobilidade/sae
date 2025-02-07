/* * */

import '@tmlmobilidade/ui/dist/styles.css';

import { ThemeProvider } from '@tmlmobilidade/ui';
import { Inter, Work_Sans } from 'next/font/google';
import { cookies as nextCookies } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';
import { DataProviders } from '@/components/providers/data-providers';
import { ConfigProviders } from '@/components/providers/config-providers';
import { Routes } from '@/lib/routes';
import AppWrapper from '@/components/AppWrapper';

/* * */

const workSans = Work_Sans({
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
			`${Routes.AUTH_API}/login?redirect=${encodeURI(Routes.URL)}`,
			RedirectType.replace
		);
	}

	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<ThemeProvider initialTheme="ocean" fontFamilyStyle={workSans.style.fontFamily}>
					<ConfigProviders>
						<DataProviders>
							<AppWrapper>
								{children}
							</AppWrapper>
						</DataProviders>
					</ConfigProviders>
				</ThemeProvider>
			</body>
		</html>
	);
}
