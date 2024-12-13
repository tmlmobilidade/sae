'use client';

/* * */

import { ActionIcon, Tooltip } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { IconCircleDotted } from '@tabler/icons-react';
import { useState } from 'react';

/* * */

interface DeleteButtonProps {
	disabled?: boolean
	onClick: () => void
}

export default function DeleteButton({ disabled = false, onClick }: DeleteButtonProps) {
	//

	//
	// A. Setup variables
	const [isLoading, setIsLoading] = useState(false);

	//
	// B. Handle actions

	const handleClick = async () => {
		setIsLoading(true);
		await onClick();
		setIsLoading(false);
	};

	//
	// C. Render components

	if (isLoading) {
		return (
			<ActionIcon loading size="lg" variant="light">
				<IconCircleDotted size={20} />
			</ActionIcon>
		);
	}

	return (
		<Tooltip color="red" disabled={disabled} label="Apagar" position="bottom" withArrow>
			<ActionIcon color="red" disabled={disabled} onClick={handleClick} size="lg" variant="light">
				<IconTrash size={20} />
			</ActionIcon>
		</Tooltip>
	);

	//
}
