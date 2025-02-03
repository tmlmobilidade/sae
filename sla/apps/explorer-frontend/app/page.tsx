'use client';

/* * */

import { useRidesContext } from '@/contexts/Rides.context';
import { DataTable, DataTableColumn } from '@tmlmobilidade/ui';
// import { DateTime } from 'luxon';

/* * */

export default function Home() {
	//

	//
	// A. Setup variables

	const ridesContext = useRidesContext();

	//
	// B. Transform data

	// const ridesListData = ridesContext.data.rides.map(ride => ({
	// 	...ride,
	// 	start_time_scheduled: DateTime.fromISO(ride.start_time_scheduled).toFormat('HH:mm'),
	// }));

	return (
		<div>

			{/* Total Rides: {ridesListData.length || 0} */}

			<DataTable
				// maxHeight={400}
				records={ridesContext.data.rides}
				columns={[
					// {
					// 	accessor: 'state',
					// 	// render: ({ state }) => renderState(state),
					// 	sortable: true,
					// 	title: (
					// 		<span>Estado</span>
					// 	),
					// },
					{
						accessor: 'pattern_id',
						// render: ({ pattern }) => renderPattern(pattern.id, pattern.headsign),
						sortable: true,
						title: 'Pattern',
						width: 200,
					},
					{
						accessor: 'start_time_scheduled',
						// render: ({ start_time }) => (
						// 	<Badge variant="primary">{start_time}</Badge>
						// ),
						sortable: true,
						title: 'Partida',
					},
					// {
					// 	accessor: 'observed.status',
					// 	// render: ({ observed }) => renderObserved(observed.status, observed.time),
					// 	sortable: true,
					// 	sortKey: 'observed.time',
					// 	title: 'Observado',
					// },
					// { accessor: 'driver_ids', title: 'Motorista' },
					// { accessor: 'result', title: 'Resultado' },
					{ accessor: 'validations_count', sortable: true, title: 'Validacoes' },
					// { accessor: 'vehicle', title: 'Veiculo' },
				]}
				search={{
					accessors: ['pattern.id', 'driver', 'start_time', 'state', 'observed.status', 'result', 'validations', 'vehicle'],
					placeholder: 'Pesquisar...',
				}}
			/>

		</div>
	);
}
