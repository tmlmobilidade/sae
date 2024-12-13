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
	const [hasPermission, setHasPermission] = useState<boolean>(true);

	useEffect(() => {
		async function fetchPermissions() {
			try {
				await getPermissions(scope, action);
				setHasPermission(true);
			}
			catch (error) {
				setHasPermission(false);
			}
		}

		fetchPermissions();
	}, [scope, action]);

	return hasPermission ? <>{children}</> : null;
}
