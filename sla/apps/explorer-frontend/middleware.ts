// The following code is taken from https://nextjs.org/docs/advanced-features/middleware#setting-headers
// This is required to set the locale from the query string or cookie before the page is rendered.

/* * */

import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

/* * */

export function middleware(request: NextRequest) {
	return NextResponse.next({
		headers: {
			'x-href': request.nextUrl.href,
		},
	});
}

export const config = {
	matcher: [
		/*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
		'/((?!api|_next/static|_next/image|favicon.ico).*)',
	],
};
