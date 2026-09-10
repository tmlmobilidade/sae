'use client';

import { type BottomSheetNavigationEntry, type BottomSheetSnapState } from '@/types/common/bottom-sheet';
import { reduceBottomSheetNavigation } from '@/utils/bottom-sheet/navigation';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

/* * */

interface UseBottomSheetReturnType {
	activeBottomSheet: BottomSheetNavigationEntry | null
	activeBottomSheetSnap: BottomSheetSnapState
	clear: () => void
	pop: () => void
	push: (value: BottomSheetNavigationEntry) => void
	replaceActive: (value: BottomSheetNavigationEntry) => void
	setActiveBottomSheetSnap: (value: BottomSheetSnapState) => void
	snapActiveBottomSheet: (snapIndex: number) => boolean
}

/* * */

let BOTTOM_SHEET_NAVIGATION_STORE: BottomSheetNavigationEntry[] = [];
let BOTTOM_SHEET_SNAP_STORE: BottomSheetSnapState = { snapIndex: null, snapPoint: null };
let ACTIVE_BOTTOM_SHEET_SNAP_CONTROLLER: ((snapIndex: number) => void) | null = null;
const bottomSheetNavigationListeners = new Set<() => void>();
const bottomSheetSnapListeners = new Set<() => void>();

export function registerActiveBottomSheetSnapController(controller: (snapIndex: number) => void) {
	ACTIVE_BOTTOM_SHEET_SNAP_CONTROLLER = controller;

	return () => {
		if (ACTIVE_BOTTOM_SHEET_SNAP_CONTROLLER === controller) ACTIVE_BOTTOM_SHEET_SNAP_CONTROLLER = null;
	};
}

function emitBottomSheetNavigationChange() {
	bottomSheetNavigationListeners.forEach(listener => listener());
}

function emitBottomSheetSnapChange() {
	bottomSheetSnapListeners.forEach(listener => listener());
}

function getBottomSheetNavigationSnapshot() {
	return BOTTOM_SHEET_NAVIGATION_STORE;
}

function getBottomSheetSnapSnapshot() {
	return BOTTOM_SHEET_SNAP_STORE;
}

function setBottomSheetNavigationStore(value: BottomSheetNavigationEntry[]) {
	if (BOTTOM_SHEET_NAVIGATION_STORE === value) return;
	BOTTOM_SHEET_NAVIGATION_STORE = value;
	emitBottomSheetNavigationChange();
}

function setBottomSheetSnapStore(value: BottomSheetSnapState) {
	if (BOTTOM_SHEET_SNAP_STORE.snapIndex === value.snapIndex && BOTTOM_SHEET_SNAP_STORE.snapPoint === value.snapPoint) return;
	BOTTOM_SHEET_SNAP_STORE = value;
	emitBottomSheetSnapChange();
}

function subscribeToBottomSheetNavigation(listener: () => void) {
	bottomSheetNavigationListeners.add(listener);
	return () => {
		bottomSheetNavigationListeners.delete(listener);
	};
}

function subscribeToBottomSheetSnap(listener: () => void) {
	bottomSheetSnapListeners.add(listener);
	return () => {
		bottomSheetSnapListeners.delete(listener);
	};
}

export function useBottomSheet(): UseBottomSheetReturnType {
	//

	//
	// A. Setup variables

	const bottomSheetNavigation = useSyncExternalStore(
		subscribeToBottomSheetNavigation,
		getBottomSheetNavigationSnapshot,
		getBottomSheetNavigationSnapshot,
	);

	const activeBottomSheetSnap = useSyncExternalStore(
		subscribeToBottomSheetSnap,
		getBottomSheetSnapSnapshot,
		getBottomSheetSnapSnapshot,
	);

	//
	// B. Transform data

	const activeBottomSheet = useMemo(() => {
		return bottomSheetNavigation[bottomSheetNavigation.length - 1] ?? null;
	}, [bottomSheetNavigation]);

	//
	// C. Handle actions

	const push = useCallback((value: BottomSheetNavigationEntry) => {
		setBottomSheetNavigationStore(reduceBottomSheetNavigation(BOTTOM_SHEET_NAVIGATION_STORE, { entry: value, type: 'push' }));
	}, []);

	const replaceActive = useCallback((value: BottomSheetNavigationEntry) => {
		setBottomSheetNavigationStore(reduceBottomSheetNavigation(BOTTOM_SHEET_NAVIGATION_STORE, { entry: value, type: 'replace-active' }));
	}, []);

	const setActiveBottomSheetSnap = useCallback((value: BottomSheetSnapState) => {
		setBottomSheetSnapStore(value);
	}, []);

	const snapActiveBottomSheet = useCallback((snapIndex: number) => {
		if (!ACTIVE_BOTTOM_SHEET_SNAP_CONTROLLER) return false;
		ACTIVE_BOTTOM_SHEET_SNAP_CONTROLLER(snapIndex);
		return true;
	}, []);

	const pop = useCallback(() => {
		setBottomSheetNavigationStore(reduceBottomSheetNavigation(BOTTOM_SHEET_NAVIGATION_STORE, { type: 'pop' }));
	}, []);

	const clear = useCallback(() => {
		setBottomSheetNavigationStore(reduceBottomSheetNavigation(BOTTOM_SHEET_NAVIGATION_STORE, { type: 'clear' }));
	}, []);

	//
	// D. Return data

	return {
		activeBottomSheet,
		activeBottomSheetSnap,
		clear,
		pop,
		push,
		replaceActive,
		setActiveBottomSheetSnap,
		snapActiveBottomSheet,
	};
}
