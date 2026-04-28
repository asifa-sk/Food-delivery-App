import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Route, TimerReset } from 'lucide-react';
import { calculateDeliveryCharge, getLocationFreshness, sanitizeDeliveryCharge, sanitizeDeliveryDistanceKm, sanitizeEtaMinutes } from '../../utils/deliveryTracking';

function toLatLng(point) {
  const lat = Number(point?.latitude);
  const lng = Number(point?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

export default function LiveDeliveryMap({ tracking }) {
  const mapReadyRef = useRef({ initialized: false, viewportKey: '' });
  const [tileState, setTileState] = useState({ status: 'loading', error: '' });

  const restaurant = toLatLng(tracking?.restaurantLocation);
  const customer = toLatLng(tracking?.customerLocation);
  const driver = toLatLng(tracking?.driverLocation);
  const routeOrigin = driver || restaurant;
  const fallbackEta = sanitizeEtaMinutes(tracking?.remainingEtaMinutes ?? tracking?.estimatedDeliveryMinutes ?? 30);
  const fallbackDistance = sanitizeDeliveryDistanceKm(tracking?.remainingDistanceKm ?? tracking?.deliveryDistanceKm);
  const deliveryCharge = sanitizeDeliveryCharge(tracking?.deliveryCharge, fallbackDistance ?? tracking?.deliveryDistanceKm);
  const routePoints = [restaurant, driver, customer].filter(Boolean);
  const mapCenter = driver || customer || restaurant || [20.5937, 78.9629];
  const [roadRoute, setRoadRoute] = useState([]);
  const freshness = getLocationFreshness(tracking?.driverLocationUpdatedAt);
  const driverIsStale = freshness.state === 'stale' || tracking?.driverLocationStale;

  useEffect(() => {
    if (routePoints.length > 0) {
      setTileState({ status: 'ready', error: '' });
    }
  }, [routePoints.length]);

  useEffect(() => {
    if (!routeOrigin || !customer) {
      setRoadRoute([]);
      return;
    }

    const abortController = new AbortController();
    const [startLat, startLng] = routeOrigin;
    const [endLat, endLng] = customer;

    const loadRoadRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
          { signal: abortController.signal }
        );
        if (!response.ok) {
          throw new Error('Route service returned an error.');
        }

        const data = await response.json();
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          throw new Error('No drivable route was returned.');
        }

        setRoadRoute(coordinates.map(([lng, lat]) => [lat, lng]));
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('road route load failed', error);
          setRoadRoute([]);
        }
      }
    };

    loadRoadRoute();
    return () => abortController.abort();
  }, [customer, routeOrigin]);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-cyan-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-50 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Live map</p>
          <p className="mt-1 text-base font-bold text-slate-900">Leaflet delivery tracking</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">{formatEta(fallbackEta)}</span>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
            {formatDistance(fallbackDistance)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50">
          <div className="relative h-[340px] w-full">
            <MapContainer
              center={mapCenter}
              zoom={routePoints.length > 0 ? 14 : 5}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                eventHandlers={{
                  loading: () => setTileState((current) => ({ ...current, status: current.status === 'ready' ? 'ready' : 'loading' })),
                  load: () => setTileState({ status: 'ready', error: '' }),
                  tileerror: () => setTileState({ status: 'error', error: 'OpenStreetMap tiles could not load.' }),
                }}
              />
              <MapViewportController
                customer={customer}
                driver={driver}
                mapReadyRef={mapReadyRef}
                roadRoute={roadRoute}
                restaurant={restaurant}
              />
              {restaurant ? (
                <Marker position={restaurant} icon={createMarkerIcon('#2563eb', 'R')}>
                  <Tooltip direction="top" offset={[0, -18]} permanent={false}>
                    {tracking?.restaurantLocation?.label || 'Restaurant'}
                  </Tooltip>
                </Marker>
              ) : null}
              {driver ? (
                <Marker position={driver} icon={createMarkerIcon(driverIsStale ? '#94a3b8' : '#f97316', 'D')}>
                  <Tooltip direction="top" offset={[0, -18]} permanent={false}>
                    {tracking?.driverName || tracking?.driverLocation?.label || 'Driver'}{driverIsStale ? ' (last known)' : ''}
                  </Tooltip>
                </Marker>
              ) : null}
              {customer ? (
                <Marker position={customer} icon={createMarkerIcon('#16a34a', 'C')}>
                  <Tooltip direction="top" offset={[0, -18]} permanent={false}>
                    {tracking?.customerLocation?.label || 'Customer'}
                  </Tooltip>
                </Marker>
              ) : null}
              {roadRoute.length > 1 ? (
                <Polyline
                  positions={roadRoute}
                  pathOptions={{ color: '#f97316', weight: 5, opacity: 0.9 }}
                />
              ) : null}
              {roadRoute.length <= 1 && routePoints.length > 1 ? (
                <Polyline
                  positions={routePoints}
                  pathOptions={{ color: '#fdba74', weight: 3, opacity: 0.65, dashArray: '8 8' }}
                />
              ) : null}
            </MapContainer>
            {tileState.status === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/85 text-sm font-medium text-slate-500">
                Loading live map...
              </div>
            )}
            {tileState.status === 'error' && (
              <div className="absolute inset-0 bg-slate-50 p-6">
                <div className="flex h-full flex-col justify-between rounded-[1.25rem] border border-slate-200 bg-white p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Live fallback</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">Tracking is active</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {tileState.error || 'Leaflet tiles could not load, so showing a live route summary instead.'}
                    </p>
                  </div>

                  <SchematicLiveMap tracking={tracking} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <InfoCard icon={Navigation} label="Driver" value={tracking?.driverName || 'Waiting for assignment'} />
          <InfoCard icon={Navigation} label="GPS freshness" value={freshness.label} />
          <InfoCard icon={TimerReset} label="ETA" value={formatEta(fallbackEta)} />
          <InfoCard icon={Route} label="Remaining distance" value={formatDistance(fallbackDistance)} />
          <InfoCard
            icon={MapPin}
            label="Delivery charge"
            value={Number.isFinite(deliveryCharge) ? `Rs. ${deliveryCharge.toFixed(2)}` : `Rs. ${calculateDeliveryCharge(fallbackDistance).toFixed(2)}`}
          />
          <div className={`rounded-3xl px-4 py-4 text-sm font-medium ${
            driverIsStale
              ? 'bg-amber-50 text-amber-700'
              : tracking?.nearby
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-50 text-slate-600'
          }`}>
            {driverIsStale
              ? `Driver location is stale. ${freshness.label}. Showing the last known driver position until a fresh GPS update arrives.`
              : tracking?.notificationMessage || (tracking?.nearby
                ? 'Delivery partner is nearby.'
                : 'Location updates arrive automatically while the order is active.')}
          </div>
        </div>
      </div>
    </div>
  );
}

function MapViewportController({ restaurant, driver, customer, roadRoute, mapReadyRef }) {
  const map = useMap();

  useEffect(() => {
    const points = [restaurant, driver, customer].filter(Boolean);
    const viewportPoints = roadRoute.length > 1 ? roadRoute : points;
    if (viewportPoints.length === 0) return;

    const viewportKey = viewportPoints
      .map(([lat, lng]) => `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`)
      .join('|');

    if (viewportPoints.length === 1) {
      if (mapReadyRef.current.viewportKey === viewportKey) return;

      map.setView(viewportPoints[0], 15, {
        animate: mapReadyRef.current.initialized,
      });
      mapReadyRef.current = { initialized: true, viewportKey };
      return;
    }

    if (mapReadyRef.current.viewportKey === viewportKey) return;

    map.fitBounds(viewportPoints, {
      padding: [48, 48],
      animate: mapReadyRef.current.initialized,
      maxZoom: 15,
    });
    mapReadyRef.current = { initialized: true, viewportKey };
  }, [customer, driver, map, mapReadyRef, restaurant, roadRoute]);

  return null;
}

function createMarkerIcon(color, label) {
  return L.divIcon({
    className: 'live-delivery-marker',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:34px;height:34px;border-radius:9999px;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;border:3px solid #fff;box-shadow:0 8px 18px rgba(15,23,42,0.18);">${label}</div>
        <div style="width:12px;height:12px;background:${color};transform:rotate(45deg);margin-top:-6px;border-radius:2px;"></div>
      </div>
    `,
    iconSize: [34, 46],
    iconAnchor: [17, 42],
    popupAnchor: [0, -34],
  });
}

function InfoCard({ icon, label, value }) {
  const IconComponent = icon;
  return (
    <div className="rounded-3xl bg-slate-50 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
          <IconComponent size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{value || '--'}</p>
        </div>
      </div>
    </div>
  );
}

function formatEta(value) {
  const minutes = sanitizeEtaMinutes(value);
  return minutes === 0 ? 'Arriving now' : `${minutes} min`;
}

function formatDistance(value) {
  if (!Number.isFinite(Number(value))) return 'Calculating';
  return `${Number(value).toFixed(2)} km`;
}

function FallbackPoint({ label, point, highlight = false }) {
  const lat = Number(point?.latitude);
  const lng = Number(point?.longitude);
  const isValid = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <div className={`rounded-2xl border px-4 py-3 ${highlight ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{point?.label || point?.name || label}</p>
      <p className="mt-1 text-xs text-slate-500">
        {isValid ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Waiting for location'}
      </p>
    </div>
  );
}

function SchematicLiveMap({ tracking }) {
  const points = [
    { key: 'restaurant', label: 'Restaurant', point: tracking?.restaurantLocation, color: '#2563eb' },
    { key: 'driver', label: 'Driver', point: tracking?.driverLocation, color: '#f97316', highlight: true },
    { key: 'customer', label: 'Customer', point: tracking?.customerLocation, color: '#16a34a' },
  ];

  const validPoints = points
    .map((item) => {
      const latitude = Number(item.point?.latitude);
      const longitude = Number(item.point?.longitude);
      return Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { ...item, latitude, longitude }
        : null;
    })
    .filter(Boolean);

  if (validPoints.length < 2) {
    return (
      <div className="mt-5 space-y-3">
        {points.map((item) => (
          <FallbackPoint key={item.key} label={item.label} point={item.point} highlight={item.highlight} />
        ))}
      </div>
    );
  }

  const latitudes = validPoints.map((item) => item.latitude);
  const longitudes = validPoints.map((item) => item.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = Math.max(maxLat - minLat, 0.0025);
  const lngRange = Math.max(maxLng - minLng, 0.0025);
  const padding = 12;

  const plottedPoints = validPoints.map((item) => {
    const x = padding + ((item.longitude - minLng) / lngRange) * (100 - padding * 2);
    const y = 100 - padding - ((item.latitude - minLat) / latRange) * (100 - padding * 2);
    return { ...item, x, y };
  });

  const restaurantPoint = plottedPoints.find((item) => item.key === 'restaurant');
  const driverPoint = plottedPoints.find((item) => item.key === 'driver');
  const customerPoint = plottedPoints.find((item) => item.key === 'customer');
  const routePoints = [restaurantPoint, driverPoint, customerPoint].filter(Boolean);
  const polyline = routePoints.map((item) => `${item.x},${item.y}`).join(' ');

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)]">
        <div className="relative aspect-[1.15/1] w-full">
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <polyline
              points={polyline}
              fill="none"
              stroke="#fb923c"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {plottedPoints.map((item) => (
              <g key={item.key} transform={`translate(${item.x} ${item.y})`}>
                <circle r="4.8" fill={item.color} opacity="0.18" />
                <circle r="2.3" fill={item.color} />
                <circle r="1" fill="#fff" />
              </g>
            ))}
          </svg>
          <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 shadow-sm">
            Live position board
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {points.map((item) => (
          <FallbackPoint key={item.key} label={item.label} point={item.point} highlight={item.highlight} />
        ))}
      </div>
    </div>
  );
}
