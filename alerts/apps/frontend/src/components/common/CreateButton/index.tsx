'use client';

import { ThemeSwitch } from '@/components/layout/ThemeSwitch';
/* * */

import { ActionIcon, Tooltip } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { IconCircleDotted } from '@tabler/icons-react';
import { useState } from 'react';

/* * */

interface CreateButtonProps {
	disabled?: boolean
	onClick: () => void
}

export default function CreateButton({ disabled = false, onClick }: CreateButtonProps) {
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
		<Tooltip color="" disabled={disabled} label="Adicionar" position="bottom" withArrow>
			<ThemeSwitch
				dark={(
					<ActionIcon color="var(--color-brand)" disabled={disabled} onClick={handleClick} size="lg" variant="light">
						<IconPlus size={20} />
					</ActionIcon>
				)}
				light={(
					<ActionIcon disabled={disabled} onClick={handleClick} size="lg" variant="light">
						<IconPlus size={20} />
					</ActionIcon>
				)}
			/>
		</Tooltip>
	);

	//
}
