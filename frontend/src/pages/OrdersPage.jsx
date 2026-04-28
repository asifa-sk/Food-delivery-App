import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Clock,
  MessageSquare,
  Package,
  RefreshCw,
  Star,
  Truck,
} from "lucide-react";
import NavbarWithCart from "../components/common/NavbarWithCart";
import CartSidebar from "../components/common/CartSidebar";
import { useToast } from "../components/common/Toast";
import LiveDeliveryMap from "../components/orders/LiveDeliveryMap";
import { useAuth } from "../hooks/useAuth";
import useOrderTrackingStream from "../hooks/useOrderTrackingStream";
import { onOrderNotification } from "../utils/notificationService";
import {
  fetchCustomerOrders,
  fetchCustomerReviews,
  submitFoodItemReview,
} from "../api/orderApi";
import { formatOrderCurrency, formatOrderDateTime, normalizeOrder } from "../utils/orderUtils";
import { clampPercent, estimateEtaFromOrder, estimateEtaMinutes, getLocationFreshness, hasCoordinates, haversineDistanceKm, isLiveDriverTrackingStatus, sanitizeDeliveryDistanceKm, sanitizeEtaMinutes, shouldRenderDriverLocation, shouldUseLiveDriverLocation } from "../utils/deliveryTracking";
import { geocodeAddress } from "../utils/locationLookup";

const parseCustomerIdFromToken = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split("-");
  if (parts.length < 4) return null;
  const maybeId = Number(parts[2]);
  return Number.isFinite(maybeId) ? maybeId : null;
};

const STATUS_CONFIG = {
  PENDING: { label: "Placed", color: "text-blue-600 bg-blue-50", icon: <Clock size={14} />, step: 1 },
  CONFIRMED: { label: "Confirmed", color: "text-indigo-600 bg-indigo-50", icon: <CheckCircle size={14} />, step: 2 },
  PREPARING: { label: "Preparing", color: "text-brand-700 bg-brand-50", icon: <AlertCircle size={14} />, step: 3 },
  DRIVER_ASSIGNED: { label: "Driver Assigned", color: "text-cyan-700 bg-cyan-50", icon: <Truck size={14} />, step: 4 },
  ACCEPTED_BY_DRIVER: { label: "Accepted by Driver", color: "text-cyan-700 bg-cyan-50", icon: <Truck size={14} />, step: 4 },
  ARRIVED_AT_RESTAURANT: { label: "At Restaurant", color: "text-sky-700 bg-sky-50", icon: <Truck size={14} />, step: 4 },
  PICKED_UP: { label: "Picked Up", color: "text-blue-700 bg-blue-50", icon: <Truck size={14} />, step: 5 },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "text-brand-600 bg-brand-50", icon: <Truck size={14} />, step: 5 },
  NEARBY: { label: "Nearby", color: "text-orange-700 bg-orange-50", icon: <Truck size={14} />, step: 6 },
  DELIVERED: { label: "Delivered", color: "text-green-700 bg-green-50", icon: <CheckCircle size={14} />, step: 7 },
  CANCELLED: { label: "Cancelled", color: "text-red-600 bg-red-50", icon: <AlertCircle size={14} />, step: 0 },
};

const ORDER_STEPS = ["Placed", "Confirmed", "Preparing", "Driver Assigned", "Picked Up", "Nearby", "Delivered"];

function DriverTrackingCard({ order, tracking, connectionState, geocodedCustomerPoint }) {
  const resolvedTracking = resolveTrackingSnapshot(order, tracking, geocodedCustomerPoint);
  const freshness = getLocationFreshness(tracking?.driverLocationUpdatedAt || order.driverLocationUpdatedAt);
  const hasLiveLocation = shouldRenderDriverLocation(order.status)
    && Number.isFinite(order.driverLastLatitude)
    && Number.isFinite(order.driverLastLongitude)
    && !(Number(order.driverLastLatitude) === 0 && Number(order.driverLastLongitude) === 0);
  const restaurantPoint = hasCoordinates({ latitude: order.restaurantLatitude, longitude: order.restaurantLongitude })
    ? { latitude: order.restaurantLatitude, longitude: order.restaurantLongitude }
    : null;
  const customerPoint = hasCoordinates({ latitude: order.customerLatitude, longitude: order.customerLongitude })
    ? { latitude: order.customerLatitude, longitude: order.customerLongitude }
    : null;
  const driverPoint = hasLiveLocation
    ? { latitude: order.driverLastLatitude, longitude: order.driverLastLongitude }
    : null;
  const totalRouteDistance = sanitizeDeliveryDistanceKm(order.deliveryDistanceKm) ?? sanitizeDeliveryDistanceKm(haversineDistanceKm(restaurantPoint, customerPoint));
  const remainingDistance = sanitizeDeliveryDistanceKm(
    tracking?.remainingDistanceKm ?? (driverPoint && customerPoint ? haversineDistanceKm(driverPoint, customerPoint) : totalRouteDistance)
  );
  const distanceTravelled = totalRouteDistance != null && remainingDistance != null
    ? Math.max(totalRouteDistance - remainingDistance, 0)
    : 0;
  const progressPercent = totalRouteDistance
    ? clampPercent((distanceTravelled / totalRouteDistance) * 100)
    : order.status === "DELIVERED"
      ? 100
      : order.status === "NEARBY"
        ? 90
        : ["PICKED_UP", "OUT_FOR_DELIVERY"].includes(order.status)
          ? 65
          : order.status === "ARRIVED_AT_RESTAURANT"
            ? 35
        : 15;
  const dynamicEtaMinutes = sanitizeEtaMinutes(tracking?.remainingEtaMinutes
    ?? (order.status === "DELIVERED"
      ? 0
      : estimateEtaMinutes(remainingDistance ?? totalRouteDistance) ?? order.estimatedDeliveryMinutes ?? estimateEtaFromOrder(order)));

  if (!order.driver && !hasLiveLocation && !tracking?.driverId) {
    return null;
  }

  const driverName = resolvedTracking?.driverName || order.driver?.name || "Your driver";

  return (
    <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-50 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Driver tracking</p>
          <p className="mt-1 text-base font-bold text-gray-900">{driverName}</p>
          <p className="mt-1 text-sm text-gray-500">
            {order.status === "NEARBY"
              ? "The driver is close to your address and the map will keep refreshing live."
              : ["PICKED_UP", "OUT_FOR_DELIVERY"].includes(order.status)
                ? "Live location refreshes automatically while the driver is on the way."
                : "Tracking is active while the driver heads to the restaurant and picks up your order."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Restaurant</p>
            <p className="mt-1 text-sm font-bold text-brand-700">{order.restaurantName}</p>
          </div>
          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">ETA</p>
            <p className="mt-1 text-sm font-bold text-brand-700">
              {dynamicEtaMinutes === 0 ? "Arriving now" : dynamicEtaMinutes ? `${dynamicEtaMinutes} min` : "Calculating"}
            </p>
          </div>
          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Driver GPS</p>
            <p className="mt-1 text-sm font-bold text-brand-700">{freshness.label}</p>
          </div>
          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Delivery fee</p>
            <p className="mt-1 text-sm font-bold text-brand-700">{formatOrderCurrency(order.deliveryCharge)}</p>
          </div>
          {(tracking?.driverLocationUpdatedAt || order.driverLocationUpdatedAt) && (
            <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Last update</p>
              <p className="mt-1 text-sm font-bold text-brand-700">
                {formatOrderDateTime(tracking?.driverLocationUpdatedAt || order.driverLocationUpdatedAt)}
              </p>
            </div>
          )}
        </div>
      </div>

      {hasLiveLocation || tracking ? (
        <div className="p-4">
          {resolvedTracking ? <LiveDeliveryMap tracking={resolvedTracking} /> : null}
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Route status</p>
              <p className="mt-1 font-semibold text-gray-800">
                {getCustomerRouteStatus(order.status)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Progress</p>
              <p className="mt-1 font-semibold text-gray-800">{Math.round(progressPercent)}% of trip completed</p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Live connection</p>
              <p className="mt-1 font-semibold text-gray-800">
                {connectionState === "connected" ? "WebSocket connected" : connectionState === "connecting" ? "Connecting..." : "Reconnecting"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-5">
          <p className="text-sm font-semibold text-gray-700">Waiting for the driver&apos;s first live location update.</p>
          <p className="mt-2 text-sm text-gray-500">
            The driver may still be enabling location access, opening the delivery screen, or sending the first GPS sync.
          </p>
        </div>
      )}
    </div>
  );
}

function resolveTrackingSnapshot(order, tracking, geocodedCustomerPoint) {
  if (!tracking && !order) return null;

  const fallbackRestaurant = buildPoint(order?.restaurantLatitude, order?.restaurantLongitude, order?.restaurantName || order?.restaurant?.name || "Restaurant");
  const fallbackCustomer = geocodedCustomerPoint || buildPoint(order?.customerLatitude, order?.customerLongitude, order?.customerName || "Customer");
  const driverLocationUpdatedAt = tracking?.driverLocationUpdatedAt || order?.driverLocationUpdatedAt;
  const useDriverPoint = shouldRenderDriverLocation(order?.status);

  return {
    ...tracking,
    restaurantLocation: resolveStaticTrackingPoint(tracking?.restaurantLocation, fallbackRestaurant),
    customerLocation: resolveStaticTrackingPoint(tracking?.customerLocation, fallbackCustomer),
    driverLocationUpdatedAt,
    driverLocation: useDriverPoint ? tracking?.driverLocation : null,
    driverLocationStale: useDriverPoint ? !shouldUseLiveDriverLocation(order?.status, driverLocationUpdatedAt) : false,
  };
}

function resolveStaticTrackingPoint(primaryPoint, fallbackPoint) {
  if (!hasCoordinates(primaryPoint)) {
    return fallbackPoint;
  }

  if (!hasCoordinates(fallbackPoint)) {
    return primaryPoint;
  }

  const driftKm = haversineDistanceKm(primaryPoint, fallbackPoint);
  if (driftKm != null && driftKm > 2) {
    return {
      ...primaryPoint,
      latitude: fallbackPoint.latitude,
      longitude: fallbackPoint.longitude,
      label: primaryPoint.label || fallbackPoint.label,
      name: primaryPoint.name || fallbackPoint.name,
    };
  }

  return primaryPoint;
}

function buildPoint(latitude, longitude, label) {
  const point = {
    latitude: Number(latitude),
    longitude: Number(longitude),
    label,
    name: label,
  };
  return hasCoordinates(point) ? point : null;
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [reviewsByOrderItem, setReviewsByOrderItem] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [savingReviewId, setSavingReviewId] = useState(null);
  const [geocodedCustomerPoints, setGeocodedCustomerPoints] = useState({});
  const lastToastRef = useRef("");

  const customerId = user?.id || parseCustomerIdFromToken(localStorage.getItem("token"));

  const loadOrders = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetchCustomerOrders(customerId);
      const raw = Array.isArray(res.data) ? res.data : [];
      setOrders(raw.map(normalizeOrder));
    } catch {
      setError("Could not load orders. Make sure you are connected to the server.");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const loadReviews = useCallback(async () => {
    if (!customerId) return;

    try {
      const res = await fetchCustomerReviews(customerId);
      const reviews = Array.isArray(res.data) ? res.data : [];
      const reviewMap = reviews.reduce((acc, review) => {
        acc[review.orderItemId] = review;
        return acc;
      }, {});

      setReviewsByOrderItem(reviewMap);
      setReviewDrafts((prev) => {
        const next = { ...prev };
        reviews.forEach((review) => {
          next[review.orderItemId] = {
            rating: review.rating || 5,
            comment: review.comment || "",
          };
        });
        return next;
      });
    } catch {
      // keep page functional even if reviews are not reachable
    }
  }, [customerId]);

  useEffect(() => {
    loadOrders();
    loadReviews();
  }, [loadOrders, loadReviews]);

  useEffect(() => {
    const off = onOrderNotification(() => {
      loadOrders();
    });
    return off;
  }, [loadOrders]);

  const hasActiveTrackedOrder = useMemo(
    () => orders.some((order) => isLiveDriverTrackingStatus(order.status)),
    [orders]
  );

  const activeTrackedOrder = useMemo(
    () => orders.find((order) => isLiveDriverTrackingStatus(order.status) && order.accepted),
    [orders]
  );

  const streamedOrder = useMemo(() => {
    const expanded = orders.find((order) => order.id === expandedOrderId);
    if (expanded && isLiveDriverTrackingStatus(expanded.status)) {
      return expanded;
    }
    return activeTrackedOrder || null;
  }, [activeTrackedOrder, expandedOrderId, orders]);

  const { tracking: liveTracking, connectionState } = useOrderTrackingStream({
    customerId,
    orderId: streamedOrder?.id,
    enabled: Boolean(customerId && streamedOrder?.id),
  });

  useEffect(() => {
    if (!streamedOrder?.id || !streamedOrder?.deliveryAddress) {
      return undefined;
    }

    if (geocodedCustomerPoints[streamedOrder.id]) {
      return undefined;
    }

    let cancelled = false;
    geocodeAddress(`${streamedOrder.deliveryAddress}, Andhra Pradesh, India`).then((point) => {
      if (cancelled || !point) return;
      setGeocodedCustomerPoints((current) => (
        current[streamedOrder.id]
          ? current
          : { ...current, [streamedOrder.id]: point }
      ));
    });

    return () => {
      cancelled = true;
    };
  }, [geocodedCustomerPoints, streamedOrder]);

  useEffect(() => {
    if (!customerId || !hasActiveTrackedOrder) {
      return undefined;
    }

    const intervalId = setInterval(loadOrders, 45000);
    return () => clearInterval(intervalId);
  }, [customerId, hasActiveTrackedOrder, loadOrders]);

  useEffect(() => {
    if (!liveTracking?.orderId) {
      return;
    }

    setOrders((currentOrders) => {
      let changed = false;

      const nextOrders = currentOrders.map((order) => {
        if (order.id !== liveTracking.orderId) {
          return order;
        }

        const nextStatus = liveTracking.status || order.status;
        const nextDeliveredAt = liveTracking.deliveredAt || order.deliveredAt;
        const nextDriverLat = liveTracking.driverLocation?.latitude ?? order.driverLastLatitude;
        const nextDriverLng = liveTracking.driverLocation?.longitude ?? order.driverLastLongitude;
        const nextLocationUpdatedAt = liveTracking.driverLocationUpdatedAt ?? order.driverLocationUpdatedAt;
        const nextDistance = liveTracking.deliveryDistanceKm ?? order.deliveryDistanceKm;
        const nextCharge = liveTracking.deliveryCharge ?? order.deliveryCharge;
        const nextEta = liveTracking.remainingEtaMinutes ?? liveTracking.estimatedDeliveryMinutes ?? order.estimatedDeliveryMinutes;
        const nextDriver = liveTracking.driverId
          ? { ...(order.driver || {}), id: liveTracking.driverId, name: liveTracking.driverName || order.driver?.name || "Driver" }
          : order.driver;

        const sameDriver =
          (order.driver?.id ?? null) === (nextDriver?.id ?? null) &&
          (order.driver?.name ?? "") === (nextDriver?.name ?? "");

        const unchanged =
          order.status === nextStatus &&
          order.deliveredAt === nextDeliveredAt &&
          Number(order.driverLastLatitude ?? NaN) === Number(nextDriverLat ?? NaN) &&
          Number(order.driverLastLongitude ?? NaN) === Number(nextDriverLng ?? NaN) &&
          String(order.driverLocationUpdatedAt ?? "") === String(nextLocationUpdatedAt ?? "") &&
          Number(order.deliveryDistanceKm ?? NaN) === Number(nextDistance ?? NaN) &&
          Number(order.deliveryCharge ?? NaN) === Number(nextCharge ?? NaN) &&
          Number(order.estimatedDeliveryMinutes ?? NaN) === Number(nextEta ?? NaN) &&
          sameDriver;

        if (unchanged) {
          return order;
        }

        changed = true;
        return normalizeOrder({
          ...order.raw,
          ...order,
          status: nextStatus,
          deliveredAt: nextDeliveredAt,
          driverLastLatitude: nextDriverLat,
          driverLastLongitude: nextDriverLng,
          driverLocationUpdatedAt: nextLocationUpdatedAt,
          deliveryDistanceKm: nextDistance,
          deliveryCharge: nextCharge,
          estimatedDeliveryMinutes: nextEta,
          driver: nextDriver,
        });
      });

      return changed ? nextOrders : currentOrders;
    });
  }, [liveTracking]);

  useEffect(() => {
    if (!liveTracking?.notificationMessage || liveTracking.notificationMessage === lastToastRef.current) {
      return;
    }
    lastToastRef.current = liveTracking.notificationMessage;
    showToast(liveTracking.notificationMessage, {
      type: liveTracking.nearby ? "success" : "info",
      duration: 5000,
    });
  }, [liveTracking, showToast]);

  const deliveredOrdersCount = useMemo(
    () => orders.filter((order) => order.status === "DELIVERED").length,
    [orders]
  );

  const toggleExpand = (id) => setExpandedOrderId((prev) => (prev === id ? null : id));

  const setDraftField = (orderItemId, field, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [orderItemId]: {
        rating: prev[orderItemId]?.rating || 5,
        comment: prev[orderItemId]?.comment || "",
        [field]: value,
      },
    }));
  };

  const handleReviewSubmit = async (order, item) => {
    const orderItemId = item.id;
    const draft = reviewDrafts[orderItemId] || { rating: 5, comment: "" };
    setSavingReviewId(orderItemId);
    setError("");

    try {
      const res = await submitFoodItemReview({
        customerId,
        orderId: order.id,
        orderItemId,
        foodItemId: item.foodItem?.id || item.foodItemId,
        rating: Number(draft.rating || 5),
        comment: draft.comment || "",
      });
      const saved = res.data;
      setReviewsByOrderItem((prev) => ({ ...prev, [orderItemId]: saved }));
      setReviewDrafts((prev) => ({
        ...prev,
        [orderItemId]: {
          rating: saved.rating || 5,
          comment: saved.comment || "",
        },
      }));
      localStorage.setItem("restaurantReviewUpdatedAt", String(Date.now()));
    } catch (reviewError) {
      setError(
        reviewError?.response?.data?.message ||
        reviewError?.response?.data ||
        "Could not save your review. Please try again."
      );
    } finally {
      setSavingReviewId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-white via-brand-50 to-accent-100 shadow-sm">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="rounded-2xl bg-white p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-100">
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-black text-gray-900 md:text-3xl">Your orders</h1>
                <p className="mt-1 text-sm text-gray-500">Track every order and review delivered dishes from one place.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Delivered</p>
                <p className="mt-1 text-xl font-black text-gray-900">{deliveredOrdersCount}</p>
              </div>
              <button onClick={loadOrders} className="rounded-2xl bg-brand-500 p-3 text-white transition hover:bg-brand-600" title="Refresh">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        {activeTrackedOrder && (
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-brand-50 shadow-sm">
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Active delivery</p>
                <h2 className="mt-2 text-xl font-black text-gray-900">
                  Track driver live for order {activeTrackedOrder.displayId}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {getActiveTrackingBanner(activeTrackedOrder.status)}
                </p>
              </div>
              <button
                onClick={() => setExpandedOrderId(activeTrackedOrder.id)}
                className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Track driver live
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-20 text-center">
            <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-center">
            <AlertCircle className="mx-auto mb-2 text-red-500" size={28} />
            <p className="font-semibold text-red-700">{error}</p>
            <button onClick={loadOrders} className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600">
              Retry
            </button>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="py-24 text-center">
            <Package className="mx-auto mb-4 text-gray-300" size={64} />
            <p className="text-xl font-bold text-gray-700">No orders yet</p>
            <p className="mt-1 text-gray-500">Explore restaurants and place your first order.</p>
            <button onClick={() => navigate("/")} className="mt-5 rounded-2xl bg-brand-500 px-6 py-3 font-bold text-white transition hover:bg-brand-600">
              Browse Restaurants
            </button>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const isExpanded = expandedOrderId === order.id;

              return (
                <div key={order.id} className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-start gap-4 p-5 md:p-6">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-sm font-black text-brand-600">
                      FO
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{order.restaurantName}</h3>
                          <p className="mt-1 text-sm text-gray-500">Order {order.displayId}</p>
                          {order.createdAt && (
                            <p className="mt-1 text-xs text-gray-400">
                              {formatOrderDateTime(order.createdAt)}
                            </p>
                          )}
                          {order.deliveredAt && (
                            <p className="mt-1 text-xs font-semibold text-green-700">
                              Delivered at {formatOrderDateTime(order.deliveredAt)}
                            </p>
                          )}
                          {isLiveDriverTrackingStatus(order.status) && (
                            <button
                              type="button"
                              onClick={() => setExpandedOrderId(order.id)}
                              className="mt-3 inline-flex rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-100"
                            >
                              Track driver live
                            </button>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <p className="mt-3 text-lg font-black text-gray-900">{formatOrderCurrency(order.totalPrice)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.accepted && isLiveDriverTrackingStatus(order.status) && (
                    <div className="border-t border-cyan-100 bg-cyan-50/50 px-5 py-5 md:px-6">
                      <DriverTrackingCard
                        order={order}
                        tracking={order.id === streamedOrder?.id ? liveTracking : null}
                        connectionState={order.id === streamedOrder?.id ? connectionState : "idle"}
                        geocodedCustomerPoint={geocodedCustomerPoints[order.id] || null}
                      />
                    </div>
                  )}

                  {order.status !== "CANCELLED" && (
                    <div className="px-5 pb-4 md:px-6">
                      <div className="flex items-center gap-1">
                        {ORDER_STEPS.map((step, idx) => {
                          const filled = cfg.step > idx;
                          const current = cfg.step === idx + 1;
                          return (
                            <div key={step} className="flex flex-1 flex-col items-center gap-1">
                              <div className={`h-1.5 w-full rounded-full transition-all ${filled || current ? "bg-brand-500" : "bg-gray-200"}`} />
                              <span className={`text-center text-[9px] font-semibold leading-tight ${current ? "text-brand-500" : filled ? "text-green-600" : "text-gray-400"}`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 md:px-6">
                    <span className="text-sm text-gray-500">{order.items.length} {order.items.length === 1 ? "item" : "items"} in this order</span>
                    <button onClick={() => toggleExpand(order.id)} className="flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline">
                      {isExpanded ? "Hide details" : "View details"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white px-5 pb-5 md:px-6">
                      <div className="space-y-4 pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Delivery address</p>
                            <p className="mt-2 text-sm font-medium text-gray-800">{order.deliveryAddress}</p>
                          </div>
                          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Order amount</p>
                            <p className="mt-1 text-lg font-black text-brand-600">{formatOrderCurrency(order.totalPrice)}</p>
                          </div>
                        </div>

                        {order.items.length > 0 && (
                          <div className="space-y-3">
                            {order.items.map((item) => {
                              const existingReview = reviewsByOrderItem[item.id];
                              const draft = reviewDrafts[item.id] || {
                                rating: existingReview?.rating || 5,
                                comment: existingReview?.comment || "",
                              };

                              return (
                                <div key={item.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <h4 className="text-base font-bold text-gray-900">{item.foodItem?.name || item.name || "Item"}</h4>
                                      <p className="mt-1 text-sm text-gray-500">
                                        Quantity {item.quantity} | {formatOrderCurrency(item.unitPrice ?? item.foodItem?.price ?? 0)}
                                      </p>
                                    </div>

                                    {order.status === "DELIVERED" ? (
                                      <div className="w-full max-w-xl rounded-3xl bg-accent-100/70 p-4 ring-1 ring-accent-200">
                                        <div className="flex items-center gap-2">
                                          <MessageSquare size={16} className="text-brand-600" />
                                          <p className="text-sm font-semibold text-gray-800">
                                            {existingReview ? "Update your dish review" : "Rate this dish"}
                                          </p>
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                          {[1, 2, 3, 4, 5].map((starValue) => (
                                            <button
                                              key={starValue}
                                              type="button"
                                              onClick={() => setDraftField(item.id, "rating", starValue)}
                                              className="transition hover:scale-110"
                                            >
                                              <Star
                                                size={18}
                                                className={starValue <= Number(draft.rating || 0) ? "fill-brand-400 text-brand-500" : "text-gray-300"}
                                              />
                                            </button>
                                          ))}
                                          <span className="ml-1 text-xs font-semibold uppercase tracking-[0.15em] text-brand-700">
                                            {draft.rating || 5}/5
                                          </span>
                                        </div>

                                        <textarea
                                          value={draft.comment}
                                          onChange={(event) => setDraftField(item.id, "comment", event.target.value)}
                                          rows={3}
                                          placeholder="Share what you liked about this item..."
                                          className="mt-3 w-full rounded-2xl border border-accent-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                                        />

                                        <div className="mt-3 flex items-center justify-between gap-3">
                                          <p className="text-xs text-gray-500">
                                            {existingReview ? "Your restaurant dashboard view will refresh with the latest item review." : "One review is saved per delivered order item."}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => handleReviewSubmit(order, item)}
                                            disabled={savingReviewId === item.id}
                                            className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {savingReviewId === item.id ? "Saving..." : existingReview ? "Update review" : "Submit review"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                        Reviews unlock once the order is delivered.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getCustomerRouteStatus(status) {
  switch (status) {
    case "DRIVER_ASSIGNED":
    case "ACCEPTED_BY_DRIVER":
      return "Driver assigned and heading to the restaurant";
    case "ARRIVED_AT_RESTAURANT":
      return "Driver has arrived at the restaurant for pickup";
    case "PICKED_UP":
      return "Order picked up and preparing to leave the restaurant";
    case "OUT_FOR_DELIVERY":
      return "Driver is heading to your address";
    case "NEARBY":
      return "Driver is nearby and almost at your address";
    default:
      return "Live delivery tracking is active";
  }
}

function getActiveTrackingBanner(status) {
  switch (status) {
    case "NEARBY":
      return "Your driver is nearby. Open the order below to follow the last part of the trip live.";
    case "OUT_FOR_DELIVERY":
    case "PICKED_UP":
      return "Your driver is on the way. Open the order below to see live location updates.";
    case "ARRIVED_AT_RESTAURANT":
      return "The driver reached the restaurant and pickup is in progress.";
    case "DRIVER_ASSIGNED":
    case "ACCEPTED_BY_DRIVER":
    default:
      return "A driver has been assigned. Live tracking will keep updating from the order details.";
  }
}
