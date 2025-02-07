'use client';

import { IconChevronLeft } from '@tabler/icons-react';
import { ActionIcon } from '@tmlmobilidade/ui';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
	href?: string
}

export default function BackButton({ href }: BackButtonProps) {
	//
	// A. Setup Variables
	const router = useRouter();

	//
	// B. Handle Events
	const handleClick = () => {
		if (href) {
			router.replace(href);
		}
		else {
			router.back();
		}
	};

	//
	// C. Render
	return (
		<ActionIcon onClick={handleClick} variant="muted">
			<IconChevronLeft />
		</ActionIcon>
	);
}
