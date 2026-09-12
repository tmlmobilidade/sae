'use client';

import { ActionIcon, FloatingPosition } from '@mantine/core';

import { Tooltip } from '../../components/common/Tooltip';

/* * */

interface LinkProps {
	href: string
	type: 'link'
}

interface ButtonProps {
	onClick: () => void
	type?: 'button'
}

type IconButtonProps = (ButtonProps | LinkProps) & {
	icon: React.ReactNode
	isDisabled?: boolean
	isLoading?: boolean
	isReadOnly?: boolean
	tooltip?: string
	tooltipOrienation?: FloatingPosition
	variant?: 'danger' | 'default' | 'disabled' | 'muted' | 'primary' | 'secondary'
};

/* * */

export function IconButton({ icon, isDisabled, isLoading, isReadOnly, tooltip, tooltipOrienation, variant = 'default', ...props }: IconButtonProps) {
	//

	//
	// A. Setup variables

	const isLink = props.type === 'link';

	//
	// B. Handle actions

	const handleClick = () => {
		// If the button is loading or in read-only mode,
		// do not trigger the onClick action
		if (isLoading || isReadOnly) return;

		// Trigger the onClick action
		if ('onClick' in props && props.onClick) {
			props.onClick();
		}
	};

	//
	// C. Render components

	const renderButton = () => {
		return (
			<ActionIcon
				component={isLink ? 'a' : 'button'}
				disabled={isDisabled}
				href={isLink ? (props as LinkProps).href : undefined}
				loading={isLoading}
				onClick={isLink ? undefined : handleClick}
				variant={variant}
			>
				{icon}
			</ActionIcon>
		);
	};

	return (
		tooltip ? (
			<Tooltip label={tooltip} position={tooltipOrienation} withArrow>
				{renderButton()}
			</Tooltip>
		) : (
			renderButton()
		)
	);
}
