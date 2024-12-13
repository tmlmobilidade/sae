'use client';

/* * */

import { ActionIcon, Tooltip } from '@mantine/core';
import { IconChevronLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

/* * */

interface BackButtonProps {
	href?: string
	onClick?: () => void
}

export default function BackButton({ href = '', onClick = () => null }: BackButtonProps) {
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
		<Tooltip color="gray" label="Voltar" position="bottom" withArrow>
			<ActionIcon color="gray" onClick={handleClick} size="lg" variant="subtle">
				<IconChevronLeft size={20} />
			</ActionIcon>
		</Tooltip>
	);

	//
}
