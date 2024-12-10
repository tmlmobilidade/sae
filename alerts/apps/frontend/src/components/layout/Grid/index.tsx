/* * */
import combineClasses from '@/utils/combineClasses';

import styles from './styles.module.css';

/* * */

interface Props extends React.HTMLAttributes<HTMLDivElement> {
	columns?: 'a' | 'aab' | 'ab' | 'abb' | 'abc' | 'abcd'
	hAlign?: 'center' | 'end' | 'start'
	vAlign?: 'center' | 'end' | 'start'
	withGap?: boolean
}

/* * */

export function Grid({ children, className, columns = 'a', hAlign = 'start', vAlign = 'start', withGap }: Props) {
	return (
		<div className={combineClasses(styles.container, styles[columns], styles[`hAlign${hAlign}`], styles[`vAlign${vAlign}`], withGap && styles.withGap, className)}>
			{children}
		</div>
	);
}
