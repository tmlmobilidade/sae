/* * */

import { GtfsValidationsDetail } from '../../../components/gtfs-validations/detail/GtfsValidationsDetail';
import { ValidationsDetailContextProvider } from '../../../components/gtfs-validations/detail/ValidationsDetailForm.context';

/* * */

export default function Page() {
	return (
		<ValidationsDetailContextProvider>
			<GtfsValidationsDetail />
		</ValidationsDetailContextProvider>
	);
}
