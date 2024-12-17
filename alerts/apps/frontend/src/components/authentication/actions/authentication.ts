'use server';
'server-only';

import { authProvider } from '@tmlmobilidade/services/providers';
import { LoginDto } from '@tmlmobilidade/services/types';
import { cookies } from 'next/headers';

/**
 * Login action
 * @success - Saves session cookie
 * @failure - Throws an HTTP error that must be handled by the caller, e.g. Show an error message
 */
export const login = async (loginDto: LoginDto) => {
	const session = await authProvider.login(loginDto);

	const cookieStore = await cookies();
	cookieStore.set('session', session.token, {
		expires: session.expires_at,
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		secure: true,
	});
};

export const logout = async () => {
	const cookieStore = await cookies();
	const cookie = cookieStore.get('session');

	if (cookie) {
		await authProvider.logout(cookie.value);
		cookieStore.delete('session');
	}
	else {
		throw new Error('Cookie not found');
	}
};

export async function getSession() {
	const cookieStore = await cookies();
	const cookie = cookieStore.get('session');

	if (!cookie) return null;

	try {
		const user = await authProvider.getUser(cookie.value);
		return user;
	}
	catch (error) {
		console.error('Error getting user', error);
		return null;
	}
};

export const getSessionCookie = async () => {
	const cookieStore = await cookies();
	const cookie = cookieStore.get('session');

	return cookie;
};

export const getPermissions = async (scope: string, action: string) => {
	const cookieStore = await cookies();
	const cookie = cookieStore.get('session');

	if (!cookie) {
		throw new Error('Cookie not found');
	}

	return authProvider.getPermissions(cookie.value, scope, action);
};
