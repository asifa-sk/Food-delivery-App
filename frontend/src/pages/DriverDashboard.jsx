import { useEffect, useMemo, useState, useCallback } from 'react';
import DriverSidebar from '../components/driver/DriverSidebar';
import DriverTopbar from '../components/driver/DriverTopbar';
import StatsCard from '../components/driver/StatsCard';
import EarningsCard from '../components/driver/EarningsCard';
import MapPanel from '../components/driver/MapPanel';
import LocationStatusBanner from '../components/driver/LocationStatusBanner';
import TripLogs from '../components/driver/TripLogs';
import { getAvailableOrders, acceptOrder, getDriverOrders, updateOrderStatus } from '../api/driverApi';
import { useToast } from '../components/common/Toast';
import { onOrderNotification, sendOrderNotification } from '../utils/notificationService';
import { formatOrderDateTime, sortOrdersByNewest } from '../utils/orderUtils';
import useDriverLocationSync from '../hooks/useDriverLocationSync';
import { readStoredJson } from '../utils/storage';

export default function DriverDashboard() {
  const driver = readStoredJson('driver', {});
  const driverId = driver?.id;
  const driverName = driver?.name || 'Driver';
  const [availableOrders, setAvailableOrders] = useState([]);
  const [driverOrders, setDriverOrders] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingDriverOrders, setLoadingDriverOrders] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const { showToast } = useToast();

  const loadAvailableOrders = useCallback(async () => {
    if (!driverId) {
      setAvailableOrders([]);
      return;
    }

    setLoadingAvailable(true);
    try {
      const res = await getAvailableOrders(driverId);
      setAvailableOrders(sortOrdersByNewest(res?.data || []));
    } catch (error) {
      console.error('Failed to load available orders', error);
    } finally {
      setLoadingAvailable(false);
    }
  }, [driverId]);

  const loadDriverOrders = useCallback(async () => {
    if (!driverId) {
      setDriverOrders([]);
      return;
    }

    setLoadingDriverOrders(true);
    try {
      const res = await getDriverOrders(driverId);
      setDriverOrders(sortOrdersByNewest(res?.data || []));
    } catch (error) {
      console.error('Failed to load driver orders', error);
    } finally {
      setLoadingDriverOrders(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadAvailableOrders();
    loadDriverOrders();
    const intervalId = setInterval(() => {
      loadAvailableOrders();
      loadDriverOrders();
    }, 12000);
    return () => clearInterval(intervalId);
  }, [driverId, loadAvailableOrders, loadDriverOrders]);

  useEffect(() => {
    if (!driverId) return () => {};

    const off = onOrderNotification(() => {
      loadAvailableOrders();
      loadDriverOrders();
    });
    return off;
  }, [driverId, loadAvailableOrders, loadDriverOrders]);

  useEffect(() => {
    const off = onOrderNotification((payload) => {
      const msg = payload.eta
        ? `Order #${payload.orderId} is ${payload.status} - ETA: ${formatOrderDateTime(payload.eta)}`
        : `Order #${payload.orderId} is ${payload.status}`;
      showToast(msg, { type: 'info', duration: 5000 });
    });
    return off;
  }, [showToast]);

  const deliveredOrders = useMemo(
    () => sortOrdersByNewest(driverOrders.filter((order) => order.status === 'DELIVERED'), 'deliveredAt'),
    [driverOrders]
  );

  const activeTrips = useMemo(
    () => sortOrdersByNewest(driverOrders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status))),
    [driverOrders]
  );

  const locationState = useDriverLocationSync(driverId, activeTrips);

  const todayEarnings = useMemo(
    () => deliveredOrders
      .filter((order) => {
        const date = order.deliveredAt || order.createdAt;
        return date && new Date(date).toDateString() === new Date().toDateString();
      })
      .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
    [deliveredOrders]
  );

  const weekEarnings = useMemo(
    () => deliveredOrders
      .filter((order) => {
        const date = new Date(order.deliveredAt || order.createdAt || 0).getTime();
        return date && Date.now() - date <= 7 * 24 * 60 * 60 * 1000;
      })
      .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
    [deliveredOrders]
  );

  const recentTrips = useMemo(() => {
    const ids = new Set();
    return [...activeTrips, ...deliveredOrders, ...availableOrders]
      .filter((trip) => {
        if (!trip?.id || ids.has(trip.id)) return false;
        ids.add(trip.id);
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(a.deliveredAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.deliveredAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [activeTrips, deliveredOrders, availableOrders]);

  const handleAccept = async (orderId) => {
    setActionLoading(orderId);
    try {
      await acceptOrder(driverId, orderId);
      await Promise.all([loadAvailableOrders(), loadDriverOrders()]);
      sendOrderNotification({ orderId, status: 'DRIVER_ASSIGNED', from: 'driver' });
      showToast('Order accepted', { type: 'success' });
    } catch (error) {
      console.error('accept from dashboard failed', error);
      const msg = error?.response?.data?.message || error?.response?.data?.debugMessage || error?.message || 'Accept failed';
      showToast(msg, { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    setActionLoading(orderId);
    try {
      await updateOrderStatus(driverId, orderId, status);
      await Promise.all([loadAvailableOrders(), loadDriverOrders()]);
      sendOrderNotification({
        orderId,
        status,
        eta: status === 'OUT_FOR_DELIVERY' ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null,
        from: 'driver',
      });
      showToast(status === 'DELIVERED' ? 'Order marked as delivered' : 'Delivery updated', { type: 'success' });
    } catch (error) {
      console.error('dashboard status update failed', error);
      const msg = error?.response?.data?.message || error?.response?.data?.debugMessage || error?.message || 'Update failed';
      if (msg === 'Driver is not assigned to this order') {
        await Promise.all([loadAvailableOrders(), loadDriverOrders()]);
      }
      showToast(msg, { type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="app-shell flex min-h-screen">
      <DriverSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <DriverTopbar driverName={driverName} />

        <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
          <section className="panel-dark relative overflow-hidden p-6 md:p-8">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,rgba(255,231,204,0.28),transparent_62%)] lg:block" />
            <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <div>
                <div className="hero-badge border-white/30 bg-white/10 text-white">Fleet command</div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">Drive smarter, not louder.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-100 md:text-base">
                  Accept fresh orders, move active deliveries forward, and close completed trips from one dashboard.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm text-brand-100">Available right now</p>
                  <p className="mt-3 text-3xl font-black text-white">{availableOrders.length}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm text-brand-100">Active trips</p>
                  <p className="mt-3 text-3xl font-black text-white">{activeTrips.length}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm text-brand-100">Delivered</p>
                  <p className="mt-3 text-3xl font-black text-white">{deliveredOrders.length}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard title="Available Orders" value={availableOrders.length} subtitle="Ready to accept" accent="blue" />
            <EarningsCard
              todayEarnings={todayEarnings}
              weekEarnings={weekEarnings}
              tripCount={driverOrders.length}
              deliveredCount={deliveredOrders.length}
            />
            <StatsCard title="Active Trips" value={activeTrips.length} subtitle="On the road" accent="orange" />
          </section>

          <section className="mt-6">
            <LocationStatusBanner state={locationState} activeTripCount={activeTrips.length} />
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <TripLogs
                loading={loadingAvailable}
                trips={availableOrders}
                onAccept={handleAccept}
                actionLoading={actionLoading}
                title="Available Orders"
                subtitle={`${availableOrders.length} ready`}
                emptyLabel="No available orders right now."
              />
              <TripLogs
                loading={loadingDriverOrders}
                trips={activeTrips}
                onStatusChange={handleStatusChange}
                actionLoading={actionLoading}
                title="Active Deliveries"
                subtitle={`${activeTrips.length} in progress`}
                emptyLabel="No active deliveries at the moment."
              />
            </div>
            <div className="space-y-4 lg:col-span-1">
              <MapPanel />
              <TripLogs
                loading={loadingDriverOrders}
                trips={recentTrips}
                actionLoading={actionLoading}
                title="Recent Trip Activity"
                subtitle="Live feed"
                emptyLabel="Recent trip activity will show here."
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
