/* * */

import { AlertsDetail } from '../../../components/alerts/detail/AlertsDetail';
import { AlertsDetailFormContextProvider } from '../../../components/alerts/detail/AlertsDetailForm.context';

/* * */

export default async function Page() {
	return (
		<AlertsDetailFormContextProvider>
			<AlertsDetail />
		</AlertsDetailFormContextProvider>
	);
}
