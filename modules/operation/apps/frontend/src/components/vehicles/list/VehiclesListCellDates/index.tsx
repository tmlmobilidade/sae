// /* * */

// import { Dates } from '@tmlmobilidade/go-utils-dates';
// import { type OperationalDate } from '@tmlmobilidade/types';
// import { TagGroup, type TagProps } from '@tmlmobilidade/ui';

// /* * */

// interface VehiclesListCellDatesProps {
// 	dates: OperationalDate[]
// }

// /* * */

// export function VehiclesListCellDates({ dates }: VehiclesListCellDatesProps) {
// 	//

// 	//
// 	// A. Transform data

// 	const preparedTags = dates
// 		.sort((a, b) => Number(a) - Number(b))
// 		.map((item): TagProps => {
// 			return {
// 				label: Dates
// 					.fromOperationalDate(item, 'Europe/Lisbon')
// 					.toFormat('dd-MM-yyyy'),
// 				variant: 'muted',
// 			};
// 		});

// 	//
// 	// B. Render components

// 	return <TagGroup limit={4} tags={preparedTags} />;

// 	//
// }
