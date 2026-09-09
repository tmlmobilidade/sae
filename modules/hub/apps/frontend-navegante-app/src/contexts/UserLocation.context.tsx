'use client';

import { type UserLocation, type UserLocationError, type UserLocationTrackingMode } from '@/types/common/user-location';
import { createUserLocationError, getDeviceOrientationBearing } from '@/utils/map/user-location';
import { useSessionStorage } from '@tmlmobilidade/ui';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* * */

interface DeviceOrientationEventConstructorWithPermission {
	requestPermission?: () => Promise<'denied' | 'granted'>
}

interface DeviceOrientationEventWithCompassHeading extends DeviceOrientationEvent {
	webkitCompassHeading?: null | number
}

interface UserLocationContextState {
	actions: {
		enableBearingTracking: () => Promise<null | UserLocation>
		followUserLocation: () => Promise<null | UserLocation>
		requestCurrentLocation: () => Promise<null | UserLocation>
		setTrackingMode: (mode: UserLocationTrackingMode) => void
	}
	data: {
		available_tracking_modes: UserLocationTrackingMode[]
		location: null | UserLocation
		location_error: null | UserLocationError
		orientation_error: null | UserLocationError
		tracking_mode: UserLocationTrackingMode
	}
	flags: {
		is_requesting_location: boolean
	}
}

/* * */

const GEOLOCATION_OPTIONS: PositionOptions = {
	enableHighAccuracy: true,
	maximumAge: 0,
	timeout: 10_000,
};

const UserLocationContext = createContext<undefined | UserLocationContextState>(undefined);

export function useUserLocation(): UserLocationContextState {
	const context = useContext(UserLocationContext);
	if (!context) {
		throw new Error('useUserLocation must be used within a UserLocationContextProvider');
	}
	return context;
}

/* * */

export function UserLocationContextProvider({ children }: PropsWithChildren) {
	//

	//
	// A. Setup variables

	const [userLocation, setUserLocation] = useState<null | UserLocation>(null);
	const [userLocationError, setUserLocationError] = useState<null | UserLocationError>(null);
	const [deviceOrientationError, setDeviceOrientationError] = useState<null | UserLocationError>(null);
	const [isRequestingUserLocation, setIsRequestingUserLocation] = useState(false);
	const [isBearingTrackingEnabled, setIsBearingTrackingEnabled] = useState(false);
	const [userLocationTrackingMode, setUserLocationTrackingMode] = useSessionStorage<UserLocationTrackingMode>({ defaultValue: 'follow', key: 'user-location-tracking-mode' });
	const pendingLocationRequestCount = useRef(0);
	const userLocationRef = useRef<null | UserLocation>(null);

	//
	// B. Transform data

	const availableUserLocationTrackingModes = useMemo(() => {
		const modes = new Set<UserLocationTrackingMode>(['follow', 'follow-bearing', 'idle']);
		if (userLocationError) modes.delete('follow');
		if (userLocationError || deviceOrientationError) modes.delete('follow-bearing');
		return Array.from(modes);
	}, [deviceOrientationError, userLocationError]);
	const isTrackingUserLocation = userLocationTrackingMode !== 'idle';

	//
	// C. Handle actions

	const handleUserLocationSuccess = useCallback((position: GeolocationPosition): UserLocation => {
		const nextUserLocation: UserLocation = {
			accuracy: position.coords.accuracy,
			bearing: userLocationRef.current?.bearing ?? null,
			latitude: position.coords.latitude,
			longitude: position.coords.longitude,
		};

		userLocationRef.current = nextUserLocation;
		setUserLocation(nextUserLocation);
		setUserLocationError(null);

		return nextUserLocation;
	}, []);

	const handleUserLocationError = useCallback((error: GeolocationPositionError) => {
		setUserLocationError(createUserLocationError(error));
	}, []);

	const requestCurrentLocation = useCallback(async (): Promise<null | UserLocation> => {
		if (typeof navigator === 'undefined' || !navigator.geolocation) {
			setUserLocationError({
				code: 'unsupported',
				message: 'Geolocation is not supported',
			});
			return null;
		}

		pendingLocationRequestCount.current += 1;
		setIsRequestingUserLocation(true);

		return new Promise((resolve) => {
			const finishRequest = () => {
				pendingLocationRequestCount.current -= 1;
				setIsRequestingUserLocation(pendingLocationRequestCount.current > 0);
			};

			navigator.geolocation.getCurrentPosition(
				(position) => {
					const location = handleUserLocationSuccess(position);
					finishRequest();
					resolve(location);
				},
				(error) => {
					handleUserLocationError(error);
					finishRequest();
					resolve(null);
				},
				GEOLOCATION_OPTIONS,
			);
		});
	}, [handleUserLocationError, handleUserLocationSuccess]);

	const followUserLocation = useCallback(async (): Promise<null | UserLocation> => {
		const location = await requestCurrentLocation();
		if (!location) return null;

		setUserLocationTrackingMode('follow');
		return location;
	}, [requestCurrentLocation, setUserLocationTrackingMode]);

	const requestDeviceOrientationPermission = useCallback(async (): Promise<boolean> => {
		if (typeof DeviceOrientationEvent === 'undefined') {
			setDeviceOrientationError({
				code: 'unsupported',
				message: 'Device orientation is not supported',
			});
			return false;
		}

		const deviceOrientationEvent = DeviceOrientationEvent as unknown as DeviceOrientationEventConstructorWithPermission;
		if (typeof deviceOrientationEvent.requestPermission !== 'function') {
			setDeviceOrientationError(null);
			setIsBearingTrackingEnabled(true);
			return true;
		}

		try {
			const permissionRequest = deviceOrientationEvent.requestPermission();
			const permission = await permissionRequest;

			if (permission !== 'granted') {
				setDeviceOrientationError({
					code: 'permission-denied',
					message: 'Device orientation permission denied',
				});
				setIsBearingTrackingEnabled(false);
				return false;
			}

			setDeviceOrientationError(null);
			setIsBearingTrackingEnabled(true);
			return true;
		} catch (error) {
			setDeviceOrientationError({
				code: 'unknown',
				message: error instanceof Error ? error.message : 'Device orientation permission failed',
			});
			setIsBearingTrackingEnabled(false);
			return false;
		}
	}, []);

	const enableBearingTracking = useCallback(async (): Promise<null | UserLocation> => {
		// Both browser permission APIs are invoked before awaiting either result.
		// WebKit requires the orientation request to remain in the user click call stack.
		const orientationPermissionRequest = requestDeviceOrientationPermission();
		const locationRequest = requestCurrentLocation();
		const [hasOrientationPermission, location] = await Promise.all([orientationPermissionRequest, locationRequest]);

		if (!location) return null;

		setUserLocationTrackingMode(hasOrientationPermission ? 'follow-bearing' : 'follow');
		return location;
	}, [requestCurrentLocation, requestDeviceOrientationPermission, setUserLocationTrackingMode]);

	//
	// D. Synchronize browser state

	useEffect(() => {
		if (!isTrackingUserLocation) return;

		if (typeof navigator === 'undefined' || !navigator.geolocation) {
			setUserLocationError({
				code: 'unsupported',
				message: 'Geolocation is not supported',
			});
			return;
		}

		const watchId = navigator.geolocation.watchPosition(
			handleUserLocationSuccess,
			handleUserLocationError,
			GEOLOCATION_OPTIONS,
		);

		return () => {
			navigator.geolocation.clearWatch(watchId);
		};
	}, [handleUserLocationError, handleUserLocationSuccess, isTrackingUserLocation]);

	useEffect(() => {
		if (userLocationTrackingMode !== 'follow-bearing') return;

		if (!isBearingTrackingEnabled) {
			setUserLocationTrackingMode('follow');
			return;
		}

		const deviceOrientationEvent = DeviceOrientationEvent as unknown as DeviceOrientationEventConstructorWithPermission;
		const eventName = typeof deviceOrientationEvent.requestPermission === 'function' || !('ondeviceorientationabsolute' in window)
			? 'deviceorientation'
			: 'deviceorientationabsolute';

		const handleOrientation = (event: DeviceOrientationEvent) => {
			const compassEvent = event as DeviceOrientationEventWithCompassHeading;
			const bearing = getDeviceOrientationBearing({
				absolute: compassEvent.absolute,
				alpha: compassEvent.alpha,
				webkitCompassHeading: compassEvent.webkitCompassHeading,
			});
			const currentUserLocation = userLocationRef.current;

			if (bearing === null || !currentUserLocation) return;

			const nextUserLocation = { ...currentUserLocation, bearing };
			userLocationRef.current = nextUserLocation;
			setUserLocation(nextUserLocation);
		};

		window.addEventListener(eventName, handleOrientation, true);
		return () => {
			window.removeEventListener(eventName, handleOrientation, true);
		};
	}, [isBearingTrackingEnabled, setUserLocationTrackingMode, userLocationTrackingMode]);

	//
	// E. Define context value

	const contextValue = useMemo<UserLocationContextState>(() => ({
		actions: {
			enableBearingTracking,
			followUserLocation,
			requestCurrentLocation,
			setTrackingMode: setUserLocationTrackingMode,
		},
		data: {
			available_tracking_modes: availableUserLocationTrackingModes,
			location: userLocation,
			location_error: userLocationError,
			orientation_error: deviceOrientationError,
			tracking_mode: userLocationTrackingMode,
		},
		flags: {
			is_requesting_location: isRequestingUserLocation,
		},
	}), [availableUserLocationTrackingModes, deviceOrientationError, enableBearingTracking, followUserLocation, isRequestingUserLocation, requestCurrentLocation, setUserLocationTrackingMode, userLocation, userLocationError, userLocationTrackingMode]);

	//
	// F. Render components

	return (
		<UserLocationContext.Provider value={contextValue}>
			{children}
		</UserLocationContext.Provider>
	);

	//
}
