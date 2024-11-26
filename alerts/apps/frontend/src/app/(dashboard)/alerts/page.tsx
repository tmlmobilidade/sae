/* * */

import AlertDetail from '@/components/alerts/AlertDetail';
import AlertList from '@/components/alerts/AlertList';
import { Grid } from '@/components/layout/Grid';
import { PageWrapper } from '@/components/layout/PageWrapper';

import styles from './styles.module.css';

/* * */

export default function Page() {
	return (
		<PageWrapper>
			<Grid className={styles.grid} columns="abb">
				<AlertList />
				<AlertDetail />
			</Grid>
		</PageWrapper>
	);
}
