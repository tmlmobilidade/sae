/* * */

import combineClasses from '@/utils/combineClasses';

import styles from './styles.module.css';

/* * */

interface Props extends React.HTMLAttributes<HTMLDivElement> {
	children?: React.ReactNode
	forceOverflow?: boolean
	fullHeight?: boolean
	padding?: 'lg' | 'md' | 'none' | 'sm'
	variant?: 'alerts' | 'brand' | 'brand2' | 'debug' | 'default' | 'muted' | 'persistent' | 'standout' | 'success' | 'warning'
}

/* * */

export function Surface({ children, className, forceOverflow, fullHeight, padding = 'none', variant = 'default', ...props }: Props) {
	//

	if (variant === 'standout') {
		return (
			<div className={combineClasses(styles.container, styles[variant], forceOverflow && styles.forceOverflow, fullHeight && styles.fullHeight, padding && styles[`padding_${padding}`], className)} {...props}>
				<div className={styles.inner}>
					{children}
				</div>
			</div>
		);
	}

	if (variant === 'alerts') {
		return (
			<div className={combineClasses(styles.container, styles[variant], forceOverflow && styles.forceOverflow, fullHeight && styles.fullHeight, padding && styles[`padding_${padding}`], className)} {...props}>
				{children}
			</div>
		);
	}

	return (
		<div className={combineClasses(styles.container, styles[variant], forceOverflow && styles.forceOverflow, fullHeight && styles.fullHeight, padding && styles[`padding_${padding}`], className)} {...props}>
			{children}
		</div>
	);

	//
}
