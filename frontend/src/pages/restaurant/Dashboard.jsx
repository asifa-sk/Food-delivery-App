import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, ChefHat, ClipboardList, Home, Menu, Package, Settings, Star, Users, X } from 'lucide-react';

const API = 'http://localhost:8081/api';

const STATUS_COLOR = {
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-purple-100 text-purple-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/restaurant/dashboard', icon: Home },
  { name: 'Orders', path: '/restaurant/orders', icon: Package },
  { name: 'Menu', path: '/restaurant/food-list', icon: ChefHat },
  { name: 'Add Food', path: '/restaurant/add-food', icon: ClipboardList },
  { name: 'Reviews', path: '/restaurant/reviews', icon: Star },
  { name: 'Customers', path: '/restaurant/customers', icon: Users },
  { name: 'Reports', path: '/restaurant/reports', icon: BarChart3 },
  { name: 'Settings', path: '/restaurant/settings', icon: Settings },
];

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuCount, setMenuCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const ownerId = user.id || user.userId;
    if (!ownerId) { setLoading(false); return; }

    fetch(`${API}/restaurants/owner/${ownerId}`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        if (arr.length > 0) {
          const r = arr[0];
          setRestaurant(r);
          const rid = r.id || r.restaurantId;
          Promise.all([
            fetch(`${API}/orders/restaurant/${rid}`).then(res => res.json()),
            fetch(`${API}/food/restaurant/${rid}/all`).then(res => res.json()),
          ]).then(([orderData, menuData]) => {
            setOrders(Array.isArray(orderData) ? orderData.slice(0, 5) : []);
            setMenuCount(Array.isArray(menuData) ? menuData.length : 0);
          }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
  const revenue = orders.reduce((sum, o) => sum + Number(o.totalPrice ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform md:translate-x-0 md:static md:inset-0`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white">R</div>
            <span className="font-bold text-gray-900">Restaurant Portal</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 md:ml-0">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-gray-900">{user.name || 'Owner'}</p>
                <p className="text-sm text-gray-500">{restaurant?.name}</p>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-500 hover:text-red-600 font-medium">Logout</button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-20 text-gray-400">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading your dashboard...
            </div>
          ) : !restaurant ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Restaurant Found</h2>
              <p className="text-gray-500 text-sm">Contact admin to link your account to a restaurant.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
                <p className="text-gray-500 text-sm mt-1">{restaurant.name} · {restaurant.address}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Menu Items', value: menuCount, color: 'bg-orange-500' },
                  { label: 'Total Orders', value: orders.length, color: 'bg-blue-500' },
                  { label: 'Active Orders', value: activeOrders, color: 'bg-yellow-500' },
                  { label: 'Revenue', value: `Rs.${revenue.toFixed(0)}`, color: 'bg-emerald-500' },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl p-5 text-white shadow-sm ${s.color}`}>
                    <div className="mb-3">
                      <span className="text-sm opacity-90">{s.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{s.value ?? '-'}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Sales</h3>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <BarChart3 size={48} />
                    <span className="ml-2">Chart will be implemented</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Status</h3>
                  <div className="space-y-3">
                    {Object.entries(STATUS_COLOR).map(([status, color]) => {
                      const count = orders.filter(o => o.status === status).length;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{status.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${color.replace('text-', 'bg-').replace('bg-', 'bg-').split(' ')[0]}`} />
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {orders.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Recent Orders</h3>
                    <Link to="/restaurant/orders" className="text-emerald-500 text-sm font-semibold hover:underline">View all</Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Order</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Items</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {orders.map(o => (
                          <tr key={o.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-3 font-semibold text-gray-700">#{o.id}</td>
                            <td className="px-6 py-3 text-gray-600">{o.customer?.name || '-'}</td>
                            <td className="px-6 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                              {(o.orderItems || []).length > 0 ? (o.orderItems || []).map(i => `${i.foodItem?.name || 'Item'} x${i.quantity}`).join(', ') : '-'}
                            </td>
                            <td className="px-6 py-3 font-semibold text-gray-900">Rs.{Number(o.totalPrice ?? 0).toFixed(2)}</td>
                            <td className="px-6 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[o.status] || STATUS_COLOR.PENDING}`}>{o.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
