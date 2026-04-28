import { useEffect, useMemo, useState } from 'react';
import LocationStatusBanner from '../../components/driver/LocationStatusBanner';
import DriverSidebar from '../../components/driver/DriverSidebar';
import DriverTopbar from '../../components/driver/DriverTopbar';
import { getAvailableOrders, getDriverOrders, acceptOrder, updateOrderStatus } from '../../api/driverApi';
import { useToast } from '../../components/common/Toast';
import { sendOrderNotification, onOrderNotification } from '../../utils/notificationService';
import { formatOrderCurrency, formatOrderDateTime, sortOrdersByNewest } from '../../utils/orderUtils';
import useDriverLocationSync from '../../hooks/useDriverLocationSync';
import { readStoredJson } from '../../utils/storage';

function OrderCard({ order, updating, onAccept, onStatusChange, currentDriverId }) {
  const assignedDriverId = order.driver?.id ?? order.raw?.driverId ?? null;
  const assignedToCurrentDriver = Number(assignedDriverId) === Number(currentDriverId);
  const canAccept = !order.driver && !order.accepted;
  const canPickup = assignedToCurrentDriver && ['ACCEPTED_BY_DRIVER', 'DRIVER_ASSIGNED'].includes(order.status);
  const canDeliver = assignedToCurrentDriver && order.status === 'OUT_FOR_DELIVERY';

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="font-semibold text-gray-900">Order {order.displayId} - {order.customerName}</div>
          <div className="text-sm text-gray-500 mt-1">{order.deliveryAddress}</div>
          <div className="text-xs text-gray-400 mt-1">Restaurant: {order.restaurant?.name || order.restaurantName}</div>
          {order.createdAt && <div className="text-xs text-gray-400 mt-1">Placed: {formatOrderDateTime(order.createdAt)}</div>}
          {order.deliveredAt && <div className="text-xs text-green-600 mt-1">Delivered: {formatOrderDateTime(order.deliveredAt)}</div>}

          <div className="mt-3 text-sm">
            <div className="font-medium text-gray-700 mb-1">Items</div>
            <ul className="space-y-1">
              {(order.items || []).map((item) => (
                <li key={item.foodItemId || item.id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>{formatOrderCurrency(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 min-w-[160px]">
          <div className="text-lg font-bold text-gray-900">{formatOrderCurrency(order.totalPrice)}</div>
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">{order.statusLabel}</span>

          <div className="flex flex-wrap justify-end gap-2">
            {canAccept && (
              <button
                onClick={() => onAccept(order.id)}
                disabled={updating === order.id}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm"
              >
                {updating === order.id ? '...' : 'Accept'}
              </button>
            )}
            {canPickup && (
              <button
                onClick={() => onStatusChange(order.id, 'OUT_FOR_DELIVERY')}
                disabled={updating === order.id}
                className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-sm"
              >
                {updating === order.id ? '...' : 'Picked Up'}
              </button>
            )}
            {canDeliver && (
              <button
                onClick={() => onStatusChange(order.id, 'DELIVERED')}
                disabled={updating === order.id}
                className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm"
              >
                {updating === order.id ? '...' : 'Mark Delivered'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DriverOrders() {
  const driver = readStoredJson('driver', {});
  const [availableOrders, setAvailableOrders] = useState([]);
  const [driverOrders, setDriverOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const { showToast } = useToast();

  const loadOrders = async () => {
    if (!driver?.id) {
      setAvailableOrders([]);
      setDriverOrders([]);
      return;
    }

    setLoading(true);
    try {
      const [availableRes, driverRes] = await Promise.all([
        getAvailableOrders(driver.id),
        getDriverOrders(driver.id),
      ]);
      setAvailableOrders(sortOrdersByNewest(availableRes?.data || []));
      setDriverOrders(sortOrdersByNewest(driverRes?.data || []));
      setError('');
    } catch (e) {
      console.error('load driver orders failed', e);
      setError('Failed to load driver orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const intervalId = setInterval(loadOrders, 10000);
    return () => clearInterval(intervalId);
  }, [driver?.id]);

  useEffect(() => {
    const off = onOrderNotification(() => {
      loadOrders();
    });
    return off;
  }, [driver?.id]);

  const activeOrders = useMemo(
    () => sortOrdersByNewest(driverOrders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status))),
    [driverOrders]
  );

  const completedOrders = useMemo(
    () => sortOrdersByNewest(driverOrders.filter((order) => order.status === 'DELIVERED'), 'deliveredAt'),
    [driverOrders]
  );

  const trackableOrders = useMemo(
    () => driverOrders.filter((order) => ['ACCEPTED_BY_DRIVER', 'DRIVER_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(order.status)),
    [driverOrders]
  );

  const locationState = useDriverLocationSync(driver?.id, trackableOrders);

  const handleAccept = async (orderId) => {
    setUpdating(orderId);
    try {
      await acceptOrder(driver?.id, orderId);
      await loadOrders();
      showToast('Order accepted', { type: 'success' });
      sendOrderNotification({ orderId, status: 'DRIVER_ASSIGNED', from: 'driver' });
    } catch (e) {
      console.error('acceptOrder failed', e);
      const msg = e?.response?.data?.message || e?.response?.data?.debugMessage || e?.response?.data?.error || e?.message || 'Accept failed';
      showToast(msg, { type: 'error' });
    } finally {
      setUpdating(null);
    }
  };

  const handleStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(driver?.id, orderId, status);
      await loadOrders();
      showToast(status === 'DELIVERED' ? 'Order marked as delivered' : 'Order updated', { type: 'success' });
      sendOrderNotification({
        orderId,
        status,
        eta: status === 'OUT_FOR_DELIVERY' ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null,
        from: 'driver',
      });
    } catch (e) {
      console.error('updateOrderStatus failed', e);
      const msg = e?.response?.data?.message || e?.response?.data?.debugMessage || e?.response?.data?.error || e?.message || 'Update failed';
      if (msg === 'Driver is not assigned to this order') {
        await loadOrders();
      }
      showToast(msg, { type: 'error' });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DriverSidebar />
      <div className="flex-1 md:ml-0">
        <DriverTopbar driverName={driver?.name || 'Driver'} />
        <div className="p-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-500 mt-1">Track available, active, and completed deliveries from one place. Live location starts syncing from this screen while a delivery is active.</p>
          </div>

          {trackableOrders.length > 0 && locationState?.requestLocationAccess ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4">
              <div className="flex-1 min-w-[220px]">
                <p className="text-sm font-bold text-orange-900">Driver live location</p>
                <p className="mt-1 text-sm text-orange-800">
                  Keep this page open and enable browser location so customers can track your delivery live.
                </p>
              </div>
              <button
                type="button"
                onClick={locationState.requestLocationAccess}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                {locationState.status === 'active' ? 'Refresh Location' : 'Enable Location'}
              </button>
            </div>
          ) : null}

          <LocationStatusBanner state={locationState} activeTripCount={trackableOrders.length} />

          {error && <div className="text-sm text-red-600">{error}</div>}
          {loading && <div className="text-gray-500">Loading orders...</div>}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Available Orders</h2>
              <span className="text-sm text-gray-500">{availableOrders.length} ready to accept</span>
            </div>
            {availableOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-gray-500">No available orders right now.</div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <OrderCard key={order.id} order={order} updating={updating} onAccept={handleAccept} onStatusChange={handleStatus} currentDriverId={driver?.id} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Active Deliveries</h2>
              <span className="text-sm text-gray-500">{activeOrders.length} in progress</span>
            </div>
            {activeOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-gray-500">No active deliveries.</div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} updating={updating} onAccept={handleAccept} onStatusChange={handleStatus} currentDriverId={driver?.id} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Delivery History</h2>
              <span className="text-sm text-gray-500">{completedOrders.length} completed</span>
            </div>
            {completedOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 text-gray-500">Completed orders will appear here.</div>
            ) : (
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} updating={updating} onAccept={handleAccept} onStatusChange={handleStatus} currentDriverId={driver?.id} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
