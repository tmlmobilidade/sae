/* * */

import { type PlanPostersContentMode, type PlanPostersFilterMode } from '@tmlmobilidade/go-types-downloads';
import { type LinesMode } from '@tmlmobilidade/go-types-offer';
import { type OperationalDate } from '@tmlmobilidade/go-types-shared';

/* * */

export interface ExportToHitouchConfig {
	canvas_profile: '0Master.A' | '0Master.B' | '0Master.C' | '0Master.F'
	content_mode: PlanPostersContentMode
	date_range: {
		end: OperationalDate
		start: OperationalDate
	}
	line_codes: string[]
	lines_mode?: LinesMode
	output: string
	source_has_calendar: boolean
	stop_ids: string[]
	stops_mode?: PlanPostersFilterMode
	workdir: string
}

/* * */

export interface CalendarAssignmentsExt {
	day_type_id: string
	service_id: string
}

export interface CalendarExt {
	comment: string
	index: string
	service_id: string
}

export interface DayTypesExt {
	day_type_id: string
	friday: string
	monday: string
	name: string
	saturday: string
	sequence_number: number
	sunday: string
	thursday: string
	tuesday: string
	wednesday: string
}

export interface DayTypeConfig {
	_id: string
	dates: OperationalDate[]
	day_type: '1' | '2' | '3'
	index: number
	name: string
	period: '1' | '2' | '3'

}

export interface GtfsDate {
	date: OperationalDate
	day_type: '1' | '2' | '3'
	holiday: '0' | '1'
	notes?: string
	period: '1' | '2' | '3'
}

export interface RoutesToCanvasExt {
	canvas_profile: string
	direction_id: number
	route_id: string
}

export interface StopsToCanvasExt {
	canvas_profile: string
	direction_id: number
	stop_id: string
}
