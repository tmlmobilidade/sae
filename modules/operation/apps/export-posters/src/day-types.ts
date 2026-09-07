/* * */

import { type DayTypeConfig } from '@/types.js';

/* * */

export const DAY_TYPES: DayTypeConfig[] = [
	//

	{
		_id: 'DT_ESC_DU',
		dates: [],
		day_type: '1',
		index: 1,
		name: 'Escolar | Dias Úteis',
		period: '1',
	},
	{
		_id: 'DT_ESC_SAB',
		dates: [],
		day_type: '2',
		index: 2,
		name: 'Escolar | Sábados',
		period: '1',
	},
	{
		_id: 'DT_ESC_DOM',
		dates: [],
		day_type: '3',
		index: 3,
		name: 'Escolar | Domingos e Feriados',
		period: '1',
	},

	//

	{
		_id: 'DT_FER_DU',
		dates: [],
		day_type: '1',
		index: 4,
		name: 'Férias Escolares | Dias Úteis',
		period: '2',
	},
	{
		_id: 'DT_FER_SAB',
		dates: [],
		day_type: '2',
		index: 5,
		name: 'Férias Escolares | Sábados',
		period: '2',
	},
	{
		_id: 'DT_FER_DOM',
		dates: [],
		day_type: '3',
		index: 6,
		name: 'Férias Escolares | Domingos e Feriados',
		period: '2',
	},

	//

	{
		_id: 'DT_VER_DU',
		dates: [],
		day_type: '1',
		index: 7,
		name: 'Verão | Dias Úteis',
		period: '3',
	},
	{
		_id: 'DT_VER_SAB',
		dates: [],
		day_type: '2',
		index: 8,
		name: 'Verão | Sábados',
		period: '3',
	},
	{
		_id: 'DT_VER_DOM',
		dates: [],
		day_type: '3',
		index: 9,
		name: 'Verão | Domingos e Feriados',
		period: '3',
	},

	//
];
