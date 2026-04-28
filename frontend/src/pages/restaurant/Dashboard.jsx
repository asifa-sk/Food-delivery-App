import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BarChart3, ChefHat, ClipboardList, Package } from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { onOrderNotification } from '../../utils/notificationService';
import { formatOrderCurrency, formatOrderDateTime, normalizeOrder } from '../../utils/orderUtils';
import RestaurantShell from '../../components/restaurant/RestaurantShell';
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

export default function RestaurantDashboard() {
  const user = readStoredJson('user', {});
  const { showToast } = useToast();
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuCount, setMenuCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const off = onOrderNotification((payload) => {
      const msg = payload.eta ? `Order #${payload.orderId} is ${payload.status} - ETA: ${formatOrderDateTime(payload.eta)}` : `Order #${payload.orderId} is ${payload.status}`;
      showToast(msg, { type: 'info', duration: 5000 });
    });
    return off;
  }, [showToast]);

  const loadDashboard = useCallback(async () => {
    const ownerId = user.id || user.userId;
    if (!ownerId) {
      setLoading(false);
      return;
    }

    try {
      const ownerRes = await fetch(`${API}/restaurants/owner/${ownerId}`);
      const data = await ownerRes.json();
      const arr = Array.isArray(data) ? data : [];
      if (arr.length === 0) {
        setRestaurant(null);
        setOrders([]);
        setMenuCount(0);
        return;
      }

      const r = arr[0];
      setRestaurant(r);
      const rid = r.id || r.restaurantId;
      const [orderRes, menuRes] = await Promise.all([
        fetch(`${API}/orders/restaurant/${rid}`),
        fetch(`${API}/food/restaurant/${rid}/all`),
      ]);
      const [orderData, menuData] = await Promise.all([orderRes.json(), menuRes.json()]);
      setOrders(Array.isArray(orderData) ? orderData.map(normalizeOrder).slice(0, 5) : []);
      setMenuCount(Array.isArray(menuData) ? menuData.length : 0);
    } catch {
      // keep current values if refresh fails
    } finally {
      setLoading(false);
    }
  }, [user.id, user.userId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const off = onOrderNotification(() => {
      loadDashboard();
    });
    return off;
  }, [loadDashboard]);

  const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
  const revenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const quickLinks = [
    { to: '/restaurant/orders', label: 'Order board', description: 'Stay on top of incoming orders and status changes.', icon: Package },
    { to: '/restaurant/food-list', label: 'Menu manager', description: 'Refine presentation and keep your catalog sharp.', icon: ChefHat },
    { to: '/restaurant/add-food', label: 'Add new dish', description: 'Launch new menu items with the same polished look.', icon: ClipboardList },
  ];

  return (
    <RestaurantShell
      title="Restaurant Dashboard"
      eyebrow="Partner command center"
      subtitle={restaurant ? `${restaurant.name} • ${restaurant.address}` : 'Operations, menu and guest activity'}
    >
      {loading ? (
        <div className="panel-surface py-20 text-center text-slate-500">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          Loading your dashboard...
        </div>
      ) : !restaurant ? (
        <div className="panel-surface py-20 text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">No restaurant found</h2>
          <p className="mt-2 text-sm text-slate-500">Contact admin to link your account to a restaurant.</p>
        </div>
      ) : (
        <>
          <section className="panel-dark relative overflow-hidden p-6 md:p-8">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,rgba(255,231,204,0.3),transparent_62%)] lg:block" />
            <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
              <div>
                <div className="hero-badge border-white/30 bg-white/10 text-white">Hospitality cockpit</div>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">Make every shift feel organised.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-100 md:text-base">
                  Track orders, revenue, menu activity and fulfillment performance from a single consistent workspace.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm text-brand-100">Today&apos;s active orders</p>
                  <p className="mt-3 text-3xl font-black text-white">{activeOrders}</p>
                </div>
                <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm text-brand-100">Recent revenue</p>
                  <p className="mt-3 text-3xl font-black text-white">{formatOrderCurrency(revenue)}</p>
                </div>
                <div className="rounded-[24px] border border-white/20 bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm text-brand-100">Live menu count</p>
                  <p className="mt-3 text-3xl font-black text-white">{menuCount ?? '-'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Menu Items', value: menuCount, accent: 'from-brand-500 to-brand-400' },
              { label: 'Recent Orders', value: orders.length, accent: 'from-brand-400 to-brand-300' },
              { label: 'Active Orders', value: activeOrders, accent: 'from-brand-500 to-brand-300' },
              { label: 'Revenue', value: formatOrderCurrency(revenue), accent: 'from-brand-400 to-brand-200' },
            ].map((stat) => (
              <div key={stat.label} className="metric-card">
                <div className={`inline-flex rounded-2xl bg-gradient-to-br px-3 py-1.5 text-xs font-bold text-white ${stat.accent}`}>
                  Live
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{stat.value ?? '-'}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className="panel-surface group p-6 transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.12)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="rounded-2xl bg-brand-50 p-3 text-brand-500">
                        <Icon size={20} />
                      </div>
                      <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">{item.label}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{item.description}</p>
                    </div>
                    <ArrowUpRight className="mt-1 text-slate-300 transition group-hover:text-brand-500" size={18} />
                  </div>
                </Link>
              );
            })}
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="panel-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Recent Orders</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Service queue</h3>
                </div>
                <Link to="/restaurant/orders" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100">
                  View all
                </Link>
              </div>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="font-semibold text-slate-800">#{order.id}</td>
                          <td>{order.customer?.name || order.customerName || '-'}</td>
                          <td className="max-w-[240px] text-xs">
                            {order.items.length > 0 ? order.items.map((item) => `${item.foodItem?.name || item.name || 'Item'} x${item.quantity}`).join(', ') : '-'}
                          </td>
                          <td className="font-semibold text-slate-900">{formatOrderCurrency(order.totalPrice)}</td>
                          <td>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[order.status] || STATUS_COLOR.PENDING}`}>{order.status}</span>
                            {order.deliveredAt ? <div className="mt-1 text-[11px] text-emerald-700">{formatOrderDateTime(order.deliveredAt)}</div> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-14 text-center text-sm text-slate-500">Orders will appear here when customers place them.</div>
              )}
            </div>

            <div className="panel-surface p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-50 p-3 text-brand-500">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Order Status</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Current mix</h3>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {Object.entries(STATUS_COLOR).map(([status, color]) => {
                  const count = orders.filter((order) => order.status === status).length;
                  return (
                    <div key={status} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-slate-700">{status.replaceAll('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}
    </RestaurantShell>
  );
}
