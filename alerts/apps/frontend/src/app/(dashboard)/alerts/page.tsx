/* * */

import { getAllAlerts } from '@/actions/alerts';
import AlertDetail from '@/components/alerts/AlertDetail';
import AlertList from '@/components/alerts/AlertList';
import { AlertsListContextProvider } from '@/components/context/AlertList.context';
import { Grid } from '@/components/layout/Grid';
import { PageWrapper } from '@/components/layout/PageWrapper';

import styles from './styles.module.css';

/* * */

export default async function Page() {
	const alertsData = await getAllAlerts();

	return (
		<AlertsListContextProvider alertsData={alertsData.data}>
			<PageWrapper>
				<Grid className={styles.grid} columns="abb" withGap>
					<AlertList />
					<AlertDetail />
				</Grid>
			</PageWrapper>
		</AlertsListContextProvider>
	);
}
