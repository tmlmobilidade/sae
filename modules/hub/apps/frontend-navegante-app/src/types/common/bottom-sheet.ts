export type BottomSheetView = 'alerts-detail' | 'lines-detail' | 'routes' | 'search' | 'stops-detail' | 'vehicles-detail' | null;

export interface BottomSheetNavigationEntry {
	entityId?: null | string
	view: BottomSheetView
}

export interface BottomSheetSnapState {
	snapIndex: null | number
	snapPoint: null | number
}

export interface SetActiveBottomSheetOptions {
	replace?: boolean
}
