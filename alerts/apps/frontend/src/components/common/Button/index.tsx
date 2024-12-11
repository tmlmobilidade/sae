/* * */

import type { ButtonProps as MantineButtonProps } from '@mantine/core';

import combineClasses from '@/utils/combineClasses';
import { Button } from '@mantine/core';
import Link from 'next/link';
import React from 'react';

import styles from './styles.module.css';

/* * */

interface ButtonProps extends MantineButtonProps {
	href?: string
	icon?: React.ReactNode
	label: string
	onClick?: () => void
	target?: string
	type?: 'button' | 'reset' | 'submit'
	variant?: 'danger' | 'default' | 'info' | 'ok' | 'pill' | 'primary' | 'warning'
}

/* * */

export default function Component({ className, href, icon, label, onClick, target, type = 'button', variant = 'default', ...props }: ButtonProps) {
	//

	const btnClass = combineClasses(className, styles.button, {
		[styles.danger]: variant === 'danger',
		[styles.info]: variant === 'info',
		[styles.ok]: variant === 'ok',
		[styles.primary]: variant === 'primary',
		[styles.warning]: variant === 'warning',
	});

	if (href) {
		return (
			<Button className={btnClass} component={Link} href={href} leftSection={icon && icon} target={target} type={type} variant={variant} {...props}>
				{label}
			</Button>
		);
	}

	return (
		<Button className={btnClass} leftSection={icon && icon} onClick={onClick} type={type} variant={variant} {...props}>
			{label}
		</Button>
	);

	//
}
