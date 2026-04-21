import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

const API = 'http://localhost:8081/api';

const STATUS_COLOR = {
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value ?? <span className="text-gray-300 text-xl">—</span>}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetch(`${API}/restaurants/admin/stats`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});

    setLoadingOrders(true);
    fetch(`${API}/orders/all`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setRecentOrders(arr.slice(-10).reverse());
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, []);

  const quickLinks = [
    { to: '/admin/restaurants', label: 'Manage Restaurants', desc: 'Approve, reject & edit listings', color: 'bg-blue-500', emoji: '🏢' },
    { to: '/admin/orders', label: 'View All Orders', desc: 'Monitor and update statuses', color: 'bg-green-500', emoji: '📋' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name || 'Admin'} 👋</h2>
        <p className="text-gray-500 text-sm mt-1">Here's your platform overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Restaurants"
          value={stats?.totalRestaurants}
          color="bg-orange-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>}
          sub={`${stats?.pendingRestaurants ?? '—'} pending approval`}
        />
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders}
          color="bg-green-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>}
          sub={`${stats?.deliveredOrders ?? '—'} delivered`}
        />

        <StatCard
          label="Active Orders"
          value={stats?.activeOrders}
          color="bg-yellow-500"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          sub="In progress right now"
        />
      </div>

      {/* Quick Actions */}
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {quickLinks.map(item => (
          <Link key={item.to} to={item.to} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform flex-shrink-0`}>
              {item.emoji}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Recent Orders</h3>
          <Link to="/admin/orders" className="text-orange-500 text-sm font-semibold hover:underline">View all →</Link>
        </div>
        {loadingOrders ? (
          <div className="py-10 text-center text-gray-400 text-sm">
            <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-semibold text-gray-700">#{o.id}</td>
                    <td className="px-6 py-3 text-gray-600">{o.customer?.name || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{o.restaurant?.name || '—'}</td>
                    <td className="px-6 py-3 text-gray-500 max-w-[200px]">
                      {(o.orderItems || []).length > 0
                        ? (o.orderItems || []).map(i => `${i.foodItem?.name || 'Item'} ×${i.quantity}`).join(', ')
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-900">₹{Number(o.totalPrice ?? 0).toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[o.status] || STATUS_COLOR.PENDING}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
