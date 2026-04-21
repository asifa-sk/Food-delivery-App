import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, ChefHat, ClipboardList, Home, Menu, Package, Settings, Star, Users, X, Clock, MapPin, Phone } from 'lucide-react';

const API = 'http://localhost:8081/api';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
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

export default function RestaurantOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const ownerId = user.id || user.userId;
    if (!ownerId) { setLoading(false); setError('Not logged in.'); return; }
    fetch(`${API}/restaurants/owner/${ownerId}`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        if (arr.length === 0) throw new Error('No restaurant found for account.');
        const rid = arr[0].id || arr[0].restaurantId;
        return fetch(`${API}/orders/restaurant/${rid}`).then(r => r.json());
      })
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      if (!res.ok) throw new Error('Failed to update');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) { setError(e.message); }
    finally { setUpdating(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
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

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 md:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Orders</h1>
            </div>
          </div>
        </header>

        <div className="p-6">
          {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
          {loading ? (
            <div className="text-center py-20 text-gray-400">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h2>
              <p className="text-gray-500">Orders will appear here when customers place them</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Order #{order.id}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(order.orderDate).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {order.deliveryAddress}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">₹{Number(order.totalAmount || 0).toFixed(2)}</div>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {order.status}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Items:</h4>
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                          <div>
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="text-sm text-gray-500 ml-2">x{item.quantity}</span>
                          </div>
                          <span className="font-semibold text-gray-900">₹{Number(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} />
                      {order.customerPhone}
                    </div>
                    <div className="flex gap-2">
                      {STATUS_OPTIONS.map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(order.id, status)}
                          disabled={updating === order.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            order.status === status
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          {updating === order.id ? '...' : status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

