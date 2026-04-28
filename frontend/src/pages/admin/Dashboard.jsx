import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, ClipboardList, Truck } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { onOrderNotification } from '../../utils/notificationService';
import { formatOrderCurrency, formatOrderDateTime, normalizeOrder } from '../../utils/orderUtils';
import { readStoredJson } from '../../utils/storage';

const API = 'http://localhost:8081/api';

const STATUS_COLOR = {
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NEARBY: 'bg-orange-100 text-orange-700',
  OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-sky-100 text-sky-700',
  ARRIVED_AT_RESTAURANT: 'bg-cyan-100 text-cyan-700',
  DRIVER_ASSIGNED: 'bg-brand-50 text-brand-700',
  ACCEPTED_BY_DRIVER: 'bg-brand-100 text-brand-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  PENDING: 'bg-brand-100 text-brand-700',
};

function StatCard({ label, value, icon, accent, sub }) {
  const IconComponent = icon;
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">{value ?? '-'}</p>
          {sub ? <p className="mt-2 text-sm text-slate-500">{sub}</p> : null}
        </div>
        <div className={`rounded-2xl ${accent} p-3 text-white shadow-lg`}>
          <IconComponent size={20} />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const user = readStoredJson('user', {});

  const loadDashboard = useCallback(() => {
    fetch(`${API}/restaurants/admin/stats`)
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});

    setLoadingOrders(true);
    fetch(`${API}/orders/all`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setRecentOrders(arr.map(normalizeOrder).slice(0, 10));
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    const off = onOrderNotification(() => {
      loadDashboard();
    });
    return off;
  }, [loadDashboard]);

  const quickLinks = [
    { to: '/admin/restaurants', label: 'Restaurant approvals', desc: 'Review listings, edit profiles and moderate launch readiness.', icon: Building2 },
    { to: '/admin/drivers', label: 'Driver operations', desc: 'Track onboarding, approvals and fleet capacity from one place.', icon: Truck },
    { to: '/admin/orders', label: 'Order oversight', desc: 'Monitor platform order flow and intervene when needed.', icon: ClipboardList },
  ];

  return (
    <AdminLayout title="Dashboard">
      <section className="panel-dark relative overflow-hidden p-6 md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,rgba(255,231,204,0.3),transparent_62%)] lg:block" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <div className="hero-badge border-white/30 bg-white/10 text-white">Operations Overview</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">Welcome back, {user.name || 'Admin'}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-100 md:text-base">
              A sharper command center for restaurants, drivers, orders and platform health across the entire Foodyy network.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-brand-100">Pending restaurants</p>
              <p className="mt-3 text-3xl font-black text-white">{stats?.pendingRestaurants ?? '-'}</p>
            </div>
            <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-brand-100">Delivered orders</p>
              <p className="mt-3 text-3xl font-black text-white">{stats?.deliveredOrders ?? '-'}</p>
            </div>
            <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-brand-100">Active now</p>
              <p className="mt-3 text-3xl font-black text-white">{stats?.activeOrders ?? '-'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Restaurants" value={stats?.totalRestaurants} accent="bg-gradient-to-br from-brand-500 to-brand-400" icon={Building2} sub={`${stats?.pendingRestaurants ?? '-'} pending approval`} />
        <StatCard label="Total Orders" value={stats?.totalOrders} accent="bg-gradient-to-br from-brand-400 to-brand-300" icon={ClipboardList} sub={`${stats?.deliveredOrders ?? '-'} delivered`} />
        <StatCard label="Active Orders" value={stats?.activeOrders} accent="bg-gradient-to-br from-brand-500 to-brand-300" icon={ArrowUpRight} sub="In progress right now" />
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Quick Actions</p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Jump into the busiest lanes</h3>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="panel-surface group p-6 transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.12)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="rounded-2xl bg-brand-50 p-3 text-brand-500">
                      <Icon size={20} />
                    </div>
                    <p className="mt-5 text-xl font-black tracking-tight text-slate-950">{item.label}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{item.desc}</p>
                  </div>
                  <ArrowUpRight className="mt-1 text-slate-300 transition group-hover:text-brand-500" size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="panel-surface mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Recent Orders</p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Latest activity across the platform</h3>
          </div>
          <Link to="/admin/orders" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100">
            View all
          </Link>
        </div>
        {loadingOrders ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
            Loading recent orders...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-semibold text-slate-800">#{order.id}</td>
                    <td>{order.customer?.name || order.customerName || '-'}</td>
                    <td>{order.restaurant?.name || order.restaurantName || '-'}</td>
                    <td className="max-w-[260px]">
                      {order.items.length > 0
                        ? order.items.map((item) => `${item.foodItem?.name || item.name || 'Item'} x${item.quantity}`).join(', ')
                        : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="font-semibold text-slate-900">{formatOrderCurrency(order.totalPrice)}</td>
                    <td>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[order.status] || STATUS_COLOR.PENDING}`}>{order.statusLabel || order.status}</span>
                      {order.deliveredAt ? <div className="mt-1 text-[11px] text-emerald-700">{formatOrderDateTime(order.deliveredAt)}</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
