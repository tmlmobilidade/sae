'use client';

import { Permission } from '@tmlmobilidade/services/types';
import { useEffect, useState } from 'react';

import { getPermissions } from '../actions/authentication';

interface PermissionsProps {
	action: string
	children: React.ReactNode
	scope: string
}

export function Permissions({ action, children, scope }: PermissionsProps) {
	const [hasPermission, setHasPermission] = useState<null | Permission<unknown>>(null);

	useEffect(() => {
		async function fetchPermissions() {
			try {
				const result = await getPermissions(scope, action);
				setHasPermission(result);
			}
			catch (error) {
				return null;
			}
		}

		fetchPermissions();
	}, [scope, action]);

	if (hasPermission === null) {
		return null;
	}

	return hasPermission ? <>{children}</> : null;
}
