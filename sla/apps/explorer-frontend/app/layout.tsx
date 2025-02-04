/* * */

import Providers from '@/app/providers';
import { availableFormats } from '@/i18n/config';
import { type Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Work_Sans } from 'next/font/google';
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
	weight: ['600', '700'],
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
						<Providers>
							{children}
						</Providers>
					</NuqsAdapter>
				</NextIntlClientProvider>
			</body>
		</html>
	);

	//
}
