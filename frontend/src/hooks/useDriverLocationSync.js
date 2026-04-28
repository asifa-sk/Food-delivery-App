import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { updateDriverLocation } from '../api/driverApi';
import { isBackendDriverLocationSyncStatus } from '../utils/deliveryTracking';

const MAX_ACCEPTABLE_GPS_ACCURACY_METERS = 500;

export default function useDriverLocationSync(driverId, orders) {
  const lastSentLocationRef = useRef({ key: '', time: 0 });
  const [runtimeState, setRuntimeState] = useState(null);
  const [retryToken, setRetryToken] = useState(0);
  const trackableOrders = useMemo(
    () => (Array.isArray(orders)
      ? orders.filter((order) => isBackendDriverLocationSyncStatus(order.status))
      : []),
    [orders]
  );
  const activeTrackedOrder = useMemo(() => {
    if (trackableOrders.length === 0) return null;

    const statusPriority = {
      OUT_FOR_DELIVERY: 3,
      ACCEPTED_BY_DRIVER: 2,
      DRIVER_ASSIGNED: 2,
    };

    return [...trackableOrders].sort((a, b) => {
      const priorityDelta = (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
      if (priorityDelta !== 0) return priorityDelta;
      const aTime = new Date(a.driverLocationUpdatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.driverLocationUpdatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    })[0];
  }, [trackableOrders]);

  const requestLocationAccess = useCallback(() => {
    if (!navigator.geolocation) {
      setRuntimeState({
        status: 'unsupported',
        message: 'This browser does not support location sharing for live tracking.',
      });
      return;
    }

    setRuntimeState({
      status: 'requesting',
      message: 'Requesting live location permission from the browser...',
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude?.toFixed?.(6));
        const longitude = Number(position.coords.longitude?.toFixed?.(6));
        const accuracy = Number(position.coords.accuracy);
        setRuntimeState({
          status: 'requesting',
          message: Number.isFinite(latitude) && Number.isFinite(longitude)
            ? `Location access granted. Preparing live sync from ${latitude.toFixed(5)}, ${longitude.toFixed(5)}${Number.isFinite(accuracy) ? ` with ~${Math.round(accuracy)}m accuracy` : ''}.`
            : 'Location access granted. Preparing live sync.',
        });
        setRetryToken((current) => current + 1);
      },
      (geoError) => {
        const message = geoError?.code === 1
          ? 'Browser location permission is blocked. Allow location for this site in the browser address bar, then tap Enable Location again.'
          : geoError?.code === 2
            ? 'Current device location is unavailable. Turn on GPS or location services, then tap Enable Location again.'
            : 'Location request timed out. Please try again with location services turned on.';
        setRuntimeState({
          status: geoError?.code === 1 ? 'blocked' : 'error',
          message,
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  }, []);

  useEffect(() => {
    if (!driverId || !activeTrackedOrder || !navigator.geolocation) {
      return undefined;
    }

    const sendLocationUpdate = async (coords) => {
      const latitude = Number(coords.latitude.toFixed(6));
      const longitude = Number(coords.longitude.toFixed(6));
      const accuracy = Number(coords.accuracy);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
        setRuntimeState({
          status: 'requesting',
          message: 'Waiting for a real GPS fix before live tracking can be shared.',
        });
        return;
      }
      if (Number.isFinite(accuracy) && accuracy > MAX_ACCEPTABLE_GPS_ACCURACY_METERS) {
        setRuntimeState({
          status: 'error',
          message: `GPS accuracy is too low right now (~${Math.round(accuracy)}m). Move outdoors or enable precise location before sharing live tracking.`,
        });
        return;
      }
      const orderId = activeTrackedOrder.id;
      const orderLabel = activeTrackedOrder.displayId || `#${orderId}`;
      const key = `${orderId}|${latitude}|${longitude}`;
      const now = Date.now();

      if (lastSentLocationRef.current.key === key && now - lastSentLocationRef.current.time < 15000) {
        return;
      }

      lastSentLocationRef.current = { key, time: now };
      await updateDriverLocation(driverId, orderId, latitude, longitude);
      setRuntimeState({
        status: 'active',
        message: `Live location is syncing for order ${orderLabel}. Current GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}${Number.isFinite(accuracy) ? ` (~${Math.round(accuracy)}m)` : ''}`,
      });
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        sendLocationUpdate(position.coords).catch((err) => {
          console.error('driver location update failed', err);
          const serverMessage =
            err?.response?.data?.debugMessage ||
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message;
          const statusCode = Number(err?.response?.status || 0);
          if (statusCode >= 500) {
            const latitude = Number(position.coords.latitude?.toFixed?.(6));
            const longitude = Number(position.coords.longitude?.toFixed?.(6));
            setRuntimeState({
              status: 'active',
              message: Number.isFinite(latitude) && Number.isFinite(longitude)
                ? `GPS captured at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}. Server sync reported a transient error, so customer tracking will keep updating through fallback refresh.`
                : 'GPS was captured. Server sync reported a transient error, so customer tracking will keep updating through fallback refresh.',
            });
            return;
          }
          setRuntimeState({
            status: 'error',
            message: serverMessage
              ? `Location was captured, but syncing failed: ${serverMessage}`
              : 'Location was captured, but syncing to the server failed. Please keep this page open and try again.',
          });
        });
      },
      (geoError) => {
        console.error('driver geolocation failed', geoError);
        const message = geoError?.code === 1
          ? 'Location permission is blocked. Please allow location access in your browser so customers can track you live.'
          : geoError?.code === 2
            ? 'Current location is unavailable right now. Check GPS/device location and try again.'
            : 'Location request timed out. Please retry with GPS/location services turned on.';
        setRuntimeState({
          status: geoError?.code === 1 ? 'blocked' : 'error',
          message,
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeTrackedOrder, driverId, retryToken]);

  if (!driverId || !activeTrackedOrder) {
    return { status: 'idle', message: '', requestLocationAccess };
  }

  if (!navigator.geolocation) {
    return {
      status: 'unsupported',
      message: 'This browser does not support location sharing for live tracking.',
      requestLocationAccess,
    };
  }

  return {
    ...(runtimeState || {
      status: 'requesting',
      message: `Waiting for location access so live tracking can start for order ${activeTrackedOrder.displayId || `#${activeTrackedOrder.id}`}.`,
    }),
    activeOrderId: activeTrackedOrder.id,
    activeOrderLabel: activeTrackedOrder.displayId || `#${activeTrackedOrder.id}`,
    requestLocationAccess,
  };
}
