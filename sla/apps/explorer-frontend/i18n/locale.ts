'use server';

/* * */

import { allEnabledLocaleCodesAndAliases, availableLocales, defaultLocaleCode, defaultLocaleCodesAndAliases } from '@/i18n/config';
import { cookies, headers } from 'next/headers';

/* * */

const COOKIE_NAME = 'NEXT_LOCALE';

/* * */

export async function setUserLocale(locale: string) {
	const cookieStore = await cookies();
	cookieStore.set(COOKIE_NAME, locale);
}

/* * */

export async function getUserLocale() {
	//

	//
	// Get headers and cookies from request

	const headersList = await headers();
	const cookieStore = await cookies();

	//
	// If the request URL has a locale in the query string, use that locale.
	// This indicates that probably the user is coming from the app or another non-browser source.

	const xHrefHeader = headersList.get('x-href');
	const localeQueryValue = xHrefHeader && new URL(xHrefHeader).searchParams.get('locale');

	const queryStringLocaleMatched = localeQueryValue && availableLocales.find(item => item.value === localeQueryValue || item.alias.includes(localeQueryValue));
	if (queryStringLocaleMatched) {
		console.log(`(1) Locale set from Query String: ${queryStringLocaleMatched.value}`);
		return queryStringLocaleMatched.value;
	}

	//
	// Read the cookie to retrieve the prefered locale setting fot the user.
	// The locale code might be an alias, so we need to match it against the list of available locales.

	const userPreferedLocale = cookieStore.get(COOKIE_NAME)?.value;
	const userPreferedLocaleMatched = userPreferedLocale && availableLocales.find(item => item.value === userPreferedLocale || item.alias.includes(userPreferedLocale));
	if (userPreferedLocaleMatched) {
		console.log(`(2) Locale set from Cookie: ${userPreferedLocaleMatched.value}`);
		return userPreferedLocaleMatched.value;
	}

	//
	// If no locale is set, try to get the locale set on the browser using the accept-language header.

	const browserPreferedLocales = headersList.get('accept-language');
	if (!browserPreferedLocales) {
		console.log(`(3) No Locale Browser. Default: ${defaultLocaleCode}`);
		return defaultLocaleCode;
	}

	//
	// Parse the accept-language header to get the best locale option for the user.
	// The Accept-Language header often contains a list of locales with optional quality values (q),
	// where higher q values indicate higher preference. Split the header value and map through
	// the array to extract the language and its q-value. Sort by quality value in descending order.
	// Since we want to eventually return the locale code, we need to check if the locale is an alias
	// and return the alias corresponding value instead.

	const browserPreferedLocalesSplit = browserPreferedLocales.split(',');

	const browserPreferedLocalesParsed = browserPreferedLocalesSplit.map((lang) => {
		const parts = lang.split(';q=');
		return {
			locale: parts[0].trim(),
			quality: parts[1] ? parseFloat(parts[1]) : 1.0, // Default q value is 1 if not specified
		};
	});

	const browserPreferedLocalesMatched = browserPreferedLocalesParsed
		.map((lang) => {
			const matchingLocaleConfiguration = availableLocales.find(item => item.alias.includes(lang.locale));
			if (matchingLocaleConfiguration) {
				return {
					...lang,
					locale: matchingLocaleConfiguration.value,
				};
			}
		})
		.filter(lang => !!lang)
		.sort((a, b) => b.quality - a.quality);

	//
	// Check if the default locale for this website is in the list of browser locales.
	// This is useful because the user can be multi-lingual and its native language is not the primary browser locale.
	// If the default locale for this website is in the list, return it. Search both for the locale code and its aliases.

	const defaultLocaleIsViableOption = browserPreferedLocalesMatched.find((lang) => {
		const isDefaultLocale = lang.locale === defaultLocaleCode;
		const isDefaultLocaleAlias = defaultLocaleCodesAndAliases.includes(lang.locale);
		return isDefaultLocale || isDefaultLocaleAlias;
	});

	if (defaultLocaleIsViableOption) {
		console.log(`(4) Matched default locale with browser preference: ${defaultLocaleIsViableOption.locale}`);
		return defaultLocaleIsViableOption.locale;
	}

	//
	// If the default locale is not in the list of browser locales, check if any of the other
	// locales in the list are enabled. Remove the locales that are not enabled.
	// If the result is an empty array, return the default locale.

	const otherLocalesThatAreViableOptions = browserPreferedLocalesMatched.filter(lang => allEnabledLocaleCodesAndAliases.includes(lang.locale));
	if (!otherLocalesThatAreViableOptions.length) {
		console.log(`(5) No Locale matched from Browser. Default: ${defaultLocaleCode}`);
		return defaultLocaleCode;
	}

	//
	// From the list of available locales that are still a viable options,
	// select the locale code with the highest preference value.

	const browserPreferedLocaleWithHighestQuality = otherLocalesThatAreViableOptions[0].locale;
	if (browserPreferedLocaleWithHighestQuality) {
		console.log(`(6) Locale matched from Browser: ${browserPreferedLocaleWithHighestQuality}`);
		return browserPreferedLocaleWithHighestQuality;
	}

	//
	// Return the default locale if no other locale is found.

	console.log(`(7) No Locale matched: ${defaultLocaleCode}`);
	return defaultLocaleCode;

	//
}
