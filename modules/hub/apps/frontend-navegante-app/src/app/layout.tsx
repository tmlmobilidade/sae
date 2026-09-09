/* * */

import pjson from '#/package.json';
import { Providers } from '@/app/providers';
import { MapContextProvider } from '@/contexts/Map.context';
import namespaceDefaultPt from '@/i18n/namespaces/default/pt.json' with { type: 'json' };
import { i18nResourceKeysPt } from '@/i18n/resources';
import { BaseProvider } from '@tmlmobilidade/ui';
import { type Metadata } from 'next';
import { type PropsWithChildren } from 'react';

import '@/styles/reset.css';
import '@/styles/navegante/font.css';
import '@/styles/navegante/color.css';

/* * */

export const metadata: Metadata = {
	description: namespaceDefaultPt.layout.metadata.description,
	metadataBase: process.env.VERCEL_URL ? new URL(`https://${process.env.VERCEL_URL}`) : new URL(`http://0.0.0.0:${process.env.PORT || 3000}`),
	title: namespaceDefaultPt.layout.metadata.title,
};

/* * */

export default async function RootLayout({ children }: PropsWithChildren) {
	return (
		<BaseProvider i18n={{ pt: i18nResourceKeysPt }} version={pjson.version}>
			<Providers>
				<MapContextProvider>
					{children}
				</MapContextProvider>
			</Providers>
		</BaseProvider>
	);
}
