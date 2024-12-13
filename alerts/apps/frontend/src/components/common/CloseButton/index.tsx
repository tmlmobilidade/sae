'use client';

/* * */

import { ActionIcon, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

/* * */

interface CloseButtonProps {
	href?: string
	onClick?: () => void
}

export default function CloseButton({ href = '', onClick = () => null }: CloseButtonProps) {
	//

	//
	// A. Setup variables

	const router = useRouter();

	//
	// B. Handle actions

	const handleClick = () => {
		if (!href) onClick();
		else if (href) router.push(href);
	};

	//
	// C. Render components

	return (
		<Tooltip color="gray" label="Fechar" position="bottom" withArrow>
			<ActionIcon color="gray" onClick={handleClick} size="lg" variant="subtle">
				<IconX size={20} />
			</ActionIcon>
		</Tooltip>
	);

	//
}
