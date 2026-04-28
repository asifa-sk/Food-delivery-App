import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Package, Phone, Truck, Navigation } from 'lucide-react';
import { onOrderNotification, sendOrderNotification } from '../../utils/notificationService';
import { formatOrderCurrency, formatOrderDateTime, normalizeOrder } from '../../utils/orderUtils';
import { getLocationFreshness, shouldUseLiveDriverLocation } from '../../utils/deliveryTracking';
import RestaurantShell from '../../components/restaurant/RestaurantShell';
import { readStoredJson } from '../../utils/storage';

const API = 'http://localhost:8081/api';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PREPARING', 'CANCELLED'];
const STATUS_COLOR = {
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NEARBY: 'bg-orange-100 text-orange-700',
  OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-sky-100 text-sky-700',
  ARRIVED_AT_RESTAURANT: 'bg-cyan-100 text-cyan-700',
  DRIVER_ASSIGNED: 'bg-brand-50 text-brand-700',
  ACCEPTED_BY_DRIVER: 'bg-cyan-100 text-cyan-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  PENDING: 'bg-brand-100 text-brand-700',
};

export default function RestaurantOrders() {
  const user = readStoredJson('user', {});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const loadOrders = useCallback(async () => {
    const ownerId = user.id || user.userId;
    if (!ownerId) {
      setLoading(false);
      setError('Not logged in.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ownerRes = await fetch(`${API}/restaurants/owner/${ownerId}`);
      const ownerData = await ownerRes.json();
      const restaurants = Array.isArray(ownerData) ? ownerData : [];
      if (restaurants.length === 0) {
        throw new Error('No restaurant found for account.');
      }

      const restaurantId = restaurants[0].id || restaurants[0].restaurantId;
      const ordersRes = await fetch(`${API}/orders/restaurant/${restaurantId}`);
      const orderData = await ordersRes.json();
      setOrders(Array.isArray(orderData) ? orderData.map(normalizeOrder) : []);
    } catch (e) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user.id, user.userId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const intervalId = setInterval(loadOrders, 12000);
    return () => clearInterval(intervalId);
  }, [loadOrders]);

  useEffect(() => {
    const off = onOrderNotification(() => {
      loadOrders();
    });
    return off;
  }, [loadOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');

      const updated = normalizeOrder(await res.json());
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)));

      sendOrderNotification({ orderId, status: newStatus, eta: null, from: 'restaurant' });
    } catch (e) {
      setError(e.message || 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <RestaurantShell
      title="Orders"
      eyebrow="Order management"
      subtitle="Track live fulfillment, customer details and kitchen progress in one place."
    >
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
      {loading ? (
        <div className="panel-surface py-20 text-center text-slate-500">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="panel-surface py-20 text-center">
          <Package size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-2xl font-black tracking-tight text-slate-950">No orders yet</h2>
          <p className="mt-2 text-sm text-slate-500">Orders will appear here when customers place them.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="panel-surface p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-black tracking-tight text-slate-950">Order #{order.id}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[order.status] || 'bg-slate-100 text-slate-700'}`}>
                      {order.statusLabel || order.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock size={15} />
                      {formatOrderDateTime(order.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={15} />
                      {order.deliveryAddress}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={15} />
                      {order.customerPhone || '-'}
                    </div>
                  </div>
                  {order.deliveredAt ? <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Delivered at {formatOrderDateTime(order.deliveredAt)}</div> : null}
                </div>

                <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Order total</p>
                  <p className="mt-2 text-3xl font-black">{formatOrderCurrency(order.totalPrice)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Items</h4>
                  <div className="mt-4 space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id || item.foodItemId} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                        <div>
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          <span className="ml-2 text-sm text-slate-500">x{item.quantity}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{formatOrderCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Update status</h4>
                  {['ACCEPTED_BY_DRIVER', 'DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'NEARBY', 'DELIVERED'].includes(order.status) ? (
                    <DeliveryPartnerCard order={order} />
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(order.id, status)}
                          disabled={updating === order.id}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                            order.status === status
                              ? 'bg-slate-950 text-white'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {updating === order.id ? 'Updating...' : status.replaceAll('_', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </RestaurantShell>
  );
}

function DeliveryPartnerCard({ order }) {
  const driverName = order.driver?.name || 'Delivery partner';
  const freshness = getLocationFreshness(order.driverLocationUpdatedAt || order.deliveredAt);
  const hasLiveGps = shouldUseLiveDriverLocation(order.status, order.driverLocationUpdatedAt)
    && Number.isFinite(order.driverLastLatitude)
    && Number.isFinite(order.driverLastLongitude);
  const phase = getDeliveryPhase(order.status);
  const PhaseIcon = phase.icon;

  return (
    <div className="mt-4 rounded-[20px] border border-cyan-100 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-600">Delivery partner tracking</p>
          <p className="mt-2 text-sm font-bold text-slate-900">{driverName}</p>
          <p className="mt-1 text-sm text-slate-600">{phase.message}</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${phase.tone}`}>
          <PhaseIcon size={14} />
          {phase.label}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Phase</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{phase.detail}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Live location</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{hasLiveGps ? freshness.label : 'Waiting for fresh GPS'}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Last update</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatOrderDateTime(order.driverLocationUpdatedAt || order.deliveredAt)}</p>
        </div>
      </div>
    </div>
  );
}

function getDeliveryPhase(status) {
  switch (status) {
    case 'ACCEPTED_BY_DRIVER':
    case 'DRIVER_ASSIGNED':
      return {
        label: 'Driver Assigned',
        detail: 'Heading to restaurant',
        message: 'The driver accepted this order and is on the way to collect it from your restaurant.',
        tone: 'bg-cyan-50 text-cyan-700',
        icon: Navigation,
      };
    case 'ARRIVED_AT_RESTAURANT':
      return {
        label: 'At Restaurant',
        detail: 'Waiting for handoff',
        message: 'The driver has reached the restaurant and is waiting to receive the order.',
        tone: 'bg-cyan-50 text-cyan-700',
        icon: Navigation,
      };
    case 'PICKED_UP':
      return {
        label: 'Picked Up',
        detail: 'Leaving restaurant',
        message: 'The order has been picked up by the driver and delivery to the customer has started.',
        tone: 'bg-sky-50 text-sky-700',
        icon: Truck,
      };
    case 'OUT_FOR_DELIVERY':
      return {
        label: 'Out for Delivery',
        detail: 'Picked up and moving to customer',
        message: 'The order has been picked up and the driver is now travelling to the customer.',
        tone: 'bg-blue-50 text-blue-700',
        icon: Truck,
      };
    case 'NEARBY':
      return {
        label: 'Nearby',
        detail: 'Almost at customer location',
        message: 'The driver is close to the customer and the delivery should complete soon.',
        tone: 'bg-orange-50 text-orange-700',
        icon: Truck,
      };
    case 'DELIVERED':
      return {
        label: 'Delivered',
        detail: 'Trip completed',
        message: 'The order was delivered successfully to the customer.',
        tone: 'bg-emerald-50 text-emerald-700',
        icon: Package,
      };
    default:
      return {
        label: 'In progress',
        detail: 'Tracking active',
        message: 'Delivery tracking is active for this order.',
        tone: 'bg-slate-100 text-slate-700',
        icon: Truck,
      };
  }
}
