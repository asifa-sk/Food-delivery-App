export const LIVE_DRIVER_TRACKING_STATUSES = [
  'ACCEPTED_BY_DRIVER',
  'DRIVER_ASSIGNED',
  'ARRIVED_AT_RESTAURANT',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'NEARBY',
];

export const BACKEND_DRIVER_LOCATION_SYNC_STATUSES = [
  'ACCEPTED_BY_DRIVER',
  'DRIVER_ASSIGNED',
  'OUT_FOR_DELIVERY',
];

export function haversineDistanceKm(start, end) {
  if (!hasCoordinates(start) || !hasCoordinates(end)) return null;
  const earthRadiusKm = 6371;
  const latDistance = toRadians(end.latitude - start.latitude);
  const lngDistance = toRadians(end.longitude - start.longitude);
  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(toRadians(start.latitude)) *
      Math.cos(toRadians(end.latitude)) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadiusKm * c).toFixed(2));
}

export function hasCoordinates(point) {
  return Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude);
}

export function isLiveDriverTrackingStatus(status) {
  return LIVE_DRIVER_TRACKING_STATUSES.includes(status);
}

export function isBackendDriverLocationSyncStatus(status) {
  return BACKEND_DRIVER_LOCATION_SYNC_STATUSES.includes(status);
}

export function estimateEtaMinutes(distanceKm) {
  const safeDistance = sanitizeDeliveryDistanceKm(distanceKm);
  if (!Number.isFinite(safeDistance)) return 30;
  return Math.max(Math.ceil((safeDistance / 22) * 60), 3);
}

export function calculateDeliveryCharge(distanceKm) {
  const safeDistance = sanitizeDeliveryDistanceKm(distanceKm);
  if (!Number.isFinite(safeDistance) || safeDistance <= 0) {
    return 10;
  }
  if (safeDistance <= 5) {
    return 10;
  }
  return Number((10 + (safeDistance - 5)).toFixed(2));
}

export function sanitizeDeliveryCharge(value, distanceKm) {
  const computedCharge = calculateDeliveryCharge(distanceKm);
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 500) {
    return computedCharge;
  }
  return Number(numericValue.toFixed(2));
}

export function estimateEtaFromOrder(order) {
  const routeEta = estimateEtaMinutes(order?.deliveryDistanceKm);
  if (routeEta != null) return routeEta;

  const fee = sanitizeDeliveryCharge(order?.deliveryCharge, order?.deliveryDistanceKm);
  if (Number.isFinite(fee) && fee > 0) {
    if (fee <= 20) return 10;
    if (fee <= 30) return 18;
    return Math.max(Math.ceil(((5 + ((fee - 30) / 8)) / 22) * 60), 20);
  }

  switch (order?.status) {
    case 'NEARBY':
      return 5;
    case 'OUT_FOR_DELIVERY':
      return 15;
    case 'PICKED_UP':
      return 16;
    case 'ARRIVED_AT_RESTAURANT':
      return 18;
    case 'ACCEPTED_BY_DRIVER':
    case 'DRIVER_ASSIGNED':
      return 22;
    case 'PREPARING':
      return 30;
    case 'CONFIRMED':
      return 35;
    case 'DELIVERED':
      return 0;
    default:
      return 25;
  }
}

export function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

export function sanitizeDeliveryDistanceKm(value, maxDistanceKm = 50) {
  const distance = Number(value);
  if (!Number.isFinite(distance) || distance < 0) return null;
  if (distance > maxDistanceKm) return null;
  return Number(distance.toFixed(2));
}

export function sanitizeEtaMinutes(value, fallback = 30) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 180) {
    return fallback;
  }
  return Math.round(minutes);
}

export function getLocationFreshness(updatedAt, staleAfterMinutes = 10) {
  if (!updatedAt) {
    return { state: 'missing', label: 'Waiting for live GPS', ageMinutes: null };
  }

  const timestamp = new Date(updatedAt).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return { state: 'missing', label: 'Waiting for live GPS', ageMinutes: null };
  }

  const ageMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (ageMinutes <= 2) {
    return { state: 'fresh', label: 'Updated just now', ageMinutes };
  }
  if (ageMinutes <= staleAfterMinutes) {
    return { state: 'recent', label: `Updated ${ageMinutes} min ago`, ageMinutes };
  }
  return { state: 'stale', label: `Last updated ${ageMinutes} min ago`, ageMinutes };
}

export function shouldUseLiveDriverLocation(status, updatedAt) {
  return isLiveDriverTrackingStatus(status) && getLocationFreshness(updatedAt).state !== 'stale';
}

export function shouldRenderDriverLocation(status) {
  return isLiveDriverTrackingStatus(status);
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}
