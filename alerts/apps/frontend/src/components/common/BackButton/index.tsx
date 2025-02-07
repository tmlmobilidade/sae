"use client";

import { ActionIcon } from "@tmlmobilidade/ui";
import { IconChevronLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
	href?: string;
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
		} else {
			router.back();
		}
	}

	//
	// C. Render 
	return (
		<ActionIcon variant='muted' onClick={handleClick}>
			<IconChevronLeft/>
		</ActionIcon>
	);
}