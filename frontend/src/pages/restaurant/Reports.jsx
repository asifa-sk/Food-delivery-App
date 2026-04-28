import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ClipboardList, IndianRupee, Truck } from 'lucide-react';
import RestaurantLayout from '../../components/restaurant/RestaurantLayout';
import { readStoredJson } from '../../utils/storage';

const API = 'http://localhost:8081/api';

export default function Reports() {
  const user = readStoredJson('user', {});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    const ownerId = user.id || user.userId;
    if (!ownerId) {
      setLoading(false);
      return;
    }

    fetch(`${API}/restaurants/owner/${ownerId}`)
      .then((r) => r.json())
      .then((arr) => {
        const linkedRestaurant = Array.isArray(arr) && arr.length ? arr[0] : null;
        if (!linkedRestaurant) return setRestaurant(null);
        setRestaurant(linkedRestaurant);
        const rid = linkedRestaurant.id || linkedRestaurant.restaurantId;
        fetch(`${API}/orders/restaurant/${rid}`)
          .then((res) => res.json())
          .then((data) => setOrders(Array.isArray(data) ? data : []))
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.totalPrice ?? 0), 0),
    [orders]
  );
  const activeOrders = useMemo(
    () => orders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status)).length,
    [orders]
  );
  const byStatus = useMemo(
    () => orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}),
    [orders]
  );

  if (loading) {
    return (
      <RestaurantLayout title="Business Reports" subtitle="Loading your reporting workspace" rightBadge="Reports">
        <div className="panel-surface py-20 text-center text-slate-500">Loading reports...</div>
      </RestaurantLayout>
    );
  }

  if (!restaurant) {
    return (
      <RestaurantLayout title="Business Reports" subtitle="Restaurant data unavailable" rightBadge="Reports">
        <div className="panel-surface py-20 text-center text-slate-500">No restaurant linked to your account.</div>
      </RestaurantLayout>
    );
  }

  return (
    <RestaurantLayout
      title="Business Reports"
      subtitle={restaurant.name}
      rightBadge={`${orders.length} orders tracked`}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total Revenue', value: `Rs. ${totalRevenue.toFixed(2)}`, icon: IndianRupee },
          { label: 'Total Orders', value: orders.length, icon: ClipboardList },
          { label: 'Active Orders', value: activeOrders, icon: Truck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="metric-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">{item.label}</p>
                  <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">{item.value}</p>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3 text-brand-500">
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="panel-surface p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-500">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Orders by status</h3>
              <p className="text-sm text-slate-500">A quick look at how orders are moving through the workflow.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="rounded-2xl border border-brand-100 bg-surface-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                  {status.replaceAll('_', ' ')}
                </div>
                <div className="mt-3 text-2xl font-black text-slate-900">{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-surface p-6">
          <h3 className="text-xl font-black text-slate-900">Recent orders</h3>
          <p className="mt-1 text-sm text-slate-500">Latest order activity from your restaurant queue.</p>

          {orders.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-brand-200 bg-brand-50 p-8 text-center text-sm text-slate-500">
              No orders yet.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.slice(0, 6).map((order) => (
                <div key={order.id} className="rounded-2xl border border-brand-100 bg-surface-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Order #{order.id}</div>
                      <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">Rs. {Number(order.totalPrice ?? 0).toFixed(2)}</div>
                      <div className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">{order.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </RestaurantLayout>
  );
}
