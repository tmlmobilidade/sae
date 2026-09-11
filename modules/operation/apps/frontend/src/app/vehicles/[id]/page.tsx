/* * */

import { VehicleDetails } from '@/components/vehicles/detail/VehicleDetails';
import { VehiclesDetailContextProvider } from '@/contexts/VehiclesDetail.context';

/* * */

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	return (
		<VehiclesDetailContextProvider vehicleId={id}>
			<VehicleDetails />
		</VehiclesDetailContextProvider>
	);
}
