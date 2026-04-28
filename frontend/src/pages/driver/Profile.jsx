import { useEffect, useMemo, useState } from 'react';
import DriverSidebar from '../../components/driver/DriverSidebar';
import DriverTopbar from '../../components/driver/DriverTopbar';
import { getDriverOrders } from '../../api/driverApi';
import { readStoredJson } from '../../utils/storage';
import { sortOrdersByNewest } from '../../utils/orderUtils';

function ProfileMetric({ label, value, tone = 'slate' }) {
  const toneClasses = {
    slate: 'bg-slate-50 text-slate-950',
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-sky-50 text-sky-600',
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <div className={`mt-4 inline-flex rounded-2xl px-4 py-3 text-3xl font-black tracking-tight ${toneClasses[tone] || toneClasses.slate}`}>
        {value}
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 break-words text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

export default function DriverProfile() {
  const driver = readStoredJson('driver', {});
  const [driverOrders, setDriverOrders] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const email = driver.email || driver.username || driver.userEmail || '-';
  const phone = driver.phone || driver.mobile || driver.phoneNumber || '-';
  const vehicle = driver.vehicle || {};
  const plate = vehicle.plate || driver.vehiclePlate || driver.vehicleNumber || '-';

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      if (!driver?.id) {
        setDriverOrders([]);
        return;
      }

      setLoadingStats(true);
      try {
        const res = await getDriverOrders(driver.id);
        if (!mounted) return;
        setDriverOrders(sortOrdersByNewest(res?.data || []));
      } catch (error) {
        console.error('Failed to load driver profile stats', error);
        if (mounted) setDriverOrders([]);
      } finally {
        if (mounted) setLoadingStats(false);
      }
    };

    loadOrders();
    return () => {
      mounted = false;
    };
  }, [driver?.id]);

  const placedOrders = useMemo(() => driverOrders.length, [driverOrders]);
  const completedOrders = useMemo(
    () => driverOrders.filter((order) => order.status === 'DELIVERED').length,
    [driverOrders]
  );
  const activeOrders = useMemo(
    () => driverOrders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status)).length,
    [driverOrders]
  );

  const statValue = (value) => (loadingStats ? '...' : value);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DriverSidebar />
      <div className="flex-1 md:ml-0">
        <DriverTopbar driverName={driver?.name || 'Driver'} />
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-6 rounded-[32px] border border-slate-200 bg-white px-7 py-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Driver Profile</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">{driver?.name || 'Driver'}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                  View your verified contact details, delivery activity, and fleet performance from one cleaner workspace.
                </p>
              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-brand-500 to-brand-400 text-2xl font-black text-white shadow-[0_20px_40px_rgba(255,107,44,0.22)]">
                {(driver?.name || 'D').slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <ProfileMetric label="Orders Placed" value={statValue(placedOrders)} tone="orange" />
            <ProfileMetric label="Orders Completed" value={statValue(completedOrders)} tone="emerald" />
            <ProfileMetric label="Active Deliveries" value={statValue(activeOrders)} tone="blue" />
          </div>

          <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">Contact & Vehicle</h2>
                <p className="mt-1 text-sm text-slate-500">Professional details currently linked to your driver account.</p>
              </div>
              {loadingStats ? (
                <div className="text-sm font-medium text-slate-400">Refreshing live stats...</div>
              ) : null}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoField label="Full Name" value={driver?.name || '-'} />
              <InfoField label="Email" value={email} />
              <InfoField label="Mobile" value={phone} />
              <InfoField label="Vehicle Plate" value={plate} />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="text-2xl font-black tracking-tight text-slate-950">Additional Info</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">ID</p>
                <p className="mt-3 text-xl font-bold text-slate-950">{driver?.id ?? '-'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Joined</p>
                <p className="mt-3 text-xl font-bold text-slate-950">{driver?.createdAt ? new Date(driver.createdAt).toLocaleDateString() : '-'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
                <p className="mt-3 text-xl font-bold text-slate-950">{driver?.status || 'Active'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
