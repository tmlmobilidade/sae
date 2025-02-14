/* * */

import Providers from '@/app/providers';
import { availableFormats } from '@/i18n/config';
import { ThemeProvider } from '@tmlmobilidade/ui';
import { type Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Work_Sans } from 'next/font/google';
import { cookies as nextCookies } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type PropsWithChildren } from 'react';

/* * */

import '@tmlmobilidade/ui/dist/styles.css';
import '@/styles/default.css';

/* * */

const workSans = Work_Sans({
	display: 'swap',
	subsets: ['latin'],
	variable: '--font-work-sans',
	weight: ['600', '700', '800'],
});

/* * */

export const metadata: Metadata = {
	description: 'Horários e Paragens em Tempo Real',
	metadataBase: process.env.NEXT_PUBLIC_URL ? new URL(process.env.NEXT_PUBLIC_URL) : new URL(`http://localhost:${process.env.PORT || 3000}`),
	title: 'CMetropolitana',
};

/* * */

export default async function RootLayout({ children }: PropsWithChildren) {
	//

	//
	// A. Fetch data

	const locale = await getLocale();
	const messages = await getMessages();

	//
	// B. Render components

	const cookies = await nextCookies();
	const sessionToken = cookies.get('session_token')?.value;

	if (!sessionToken) {
		// redirect(`${process.env.NEXT_PUBLIC_AUTH_API_URL ?? 'http://localhost:3001'}/login?redirect=${encodeURI('http://localhost:3004')}`, RedirectType.replace);
	}

	//
	// C. Render components

	return (
		<html className={workSans.variable} lang={locale}>
			<head>
				<meta content="transparent" name="theme-color" />
			</head>
			<body>
				<NextIntlClientProvider
					formats={availableFormats}
					locale={locale}
					messages={messages}
				>
					<NuqsAdapter>
						<ThemeProvider fontFamilyStyle={workSans.style.fontFamily}>
							<Providers>
								{children}
							</Providers>
						</ThemeProvider>
					</NuqsAdapter>
				</NextIntlClientProvider>
			</body>
		</html>
	);

	//
}
