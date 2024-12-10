/* * */

import { IconCaretRightFilled } from '@tabler/icons-react';
import Link from 'next/link';

import styles from './styles.module.css';

/* * */

interface Props {
	children?: React.ReactNode
	heading?: string
	href?: string
	subheading?: string
	target?: '_blank' | '_self'
	variant?: 'default' | 'muted' | 'standout' | 'success' | 'warning'
	withBottomDivider?: boolean
	withGap?: boolean
	withPadding?: boolean
}

/* * */

export function Section({ children, heading, href, subheading, target, variant = 'default', withBottomDivider, withGap, withPadding }: Props) {
	return (
		<section className={`${styles.container} ${withBottomDivider && styles.withBottomDivider} ${withGap && styles.withGap} ${withPadding && styles.withPadding} ${styles[variant]}`}>

			{(heading || subheading) && (
				<div className={styles.headingWrapper}>
					{heading && !href && <h1 className={styles.heading}>{heading}</h1>}
					{heading && href && (
						<Link className={styles.href} href={href} target={target}>
							<h1 className={styles.heading}>{heading}</h1>
							<IconCaretRightFilled className={styles.hrefIcon} size={18} />
						</Link>
					)}
					{subheading && <h6 className={styles.subheading}>{subheading}</h6>}
				</div>
			)}

			{children && (
				<div className={styles.childrenWrapper}>
					{children}
				</div>
			)}

		</section>
	);
}
