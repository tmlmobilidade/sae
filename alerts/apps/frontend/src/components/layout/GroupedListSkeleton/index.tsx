/* * */

import { Skeleton } from '@mantine/core';

import styles from './styles.module.css';

/* * */

interface GroupedListSkeletonProps {
	groupCount: number
	itemCount: number
	itemSkeleton: React.ReactNode
}

/* * */

export default function Component({ groupCount, itemCount, itemSkeleton }: GroupedListSkeletonProps) {
	return (
		<>
			{Array.from({ length: groupCount }).map((_, groupIndex) => (
				<div className={styles.container} key={groupIndex}>
					<div className={styles.header}>
						<Skeleton className={styles.label} />
						<Skeleton className={styles.title} />
					</div>
					{Array.from({ length: itemCount }).map((_, itemIndex) => (
						<div className={styles.childrenWrapper} key={itemIndex}>
							{itemSkeleton}
						</div>
					))}
				</div>
			))}
		</>
	);
}
