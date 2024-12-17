/* * */

import AlertDetail from '@/components/alerts/AlertDetail';
import AlertList from '@/components/alerts/AlertList';
import { AlertsListContextProvider } from '@/context/AlertList.context';
import { Grid } from '@/components/layout/Grid';
import { PageWrapper } from '@/components/layout/PageWrapper';

import styles from './styles.module.css';

/* * */

export default function Page() {
	return (
		<AlertsListContextProvider>
			<PageWrapper>
				<Grid className={styles.grid} columns="abb" withGap>
					<AlertList />
					<AlertDetail />
				</Grid>
			</PageWrapper>
		</AlertsListContextProvider>
	);
}
