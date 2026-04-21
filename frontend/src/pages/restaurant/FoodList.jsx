import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ChefHat,
  ClipboardList,
  Home,
  Menu,
  Package,
  Settings,
  Star,
  Users,
  X,
  Search,
  Plus,
  Trash2,
} from 'lucide-react';

const API = 'http://localhost:8081/api';
const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f3f4f6"/><text x="50%25" y="52%25" font-size="16" text-anchor="middle" fill="%236b7280">Food Image</text></svg>';

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

export default function RestaurantFoodList() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const ownerId = user.id || user.userId;
    if (!ownerId) {
      setLoading(false);
      setError('Not logged in.');
      return;
    }

    fetch(`${API}/restaurants/owner/${ownerId}`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        if (arr.length === 0) throw new Error('No restaurant found for your account.');
        const rid = arr[0].id || arr[0].restaurantId;
        return fetch(`${API}/food/restaurant/${rid}/all`).then((r) => r.json());
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this food item?')) return;
    setDeleting(id);

    try {
      const res = await fetch(`${API}/food/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.name?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform md:translate-x-0 md:static md:inset-0`}
      >
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 md:ml-0">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Menu Management</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <Link
                to="/restaurant/add-food"
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition"
              >
                <Plus size={16} />
                Add Item
              </Link>
            </div>
          </div>
        </header>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-gray-400">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading menu...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xl font-semibold text-gray-700 mb-2">No menu items found</p>
              <p className="text-gray-500 mb-4">Add your first dish to get started.</p>
              <Link
                to="/restaurant/add-food"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition"
              >
                <Plus size={16} />
                Add Food Item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredItems.map((item) => {
                const imageSrc = item.imageUrl?.trim() ? item.imageUrl : PLACEHOLDER;
                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative h-36 sm:h-auto sm:w-44 md:w-52 flex-shrink-0 bg-gray-100">
                        <img
                          src={imageSrc}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER;
                          }}
                        />
                        <div className="absolute top-3 right-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {item.available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="mb-1 text-lg font-bold text-gray-900">{item.name}</h3>
                            <p className="mb-2 text-sm text-gray-500">{item.category || 'Uncategorized'}</p>
                            <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">
                              {item.description || 'No description added yet.'}
                            </p>
                          </div>
                          <div className="text-left sm:min-w-[110px] sm:text-right">
                            <span className="text-xl font-bold text-gray-900">
                              Rs. {Number(item.price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            {deleting === item.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
