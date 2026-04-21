import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, ChefHat, ClipboardList, Home, Menu, Package, Settings, Star, Users, X, Upload, Save } from 'lucide-react';

const API = 'http://localhost:8081/api';

const CATEGORIES = ['Appetizers', 'Starters', 'Main Course', 'Curry', 'Desserts', 'Beverages', 'Side Dish', 'Sides', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pizza', 'Burgers', 'Sandwiches', 'Salads', 'Soups', 'Seafood', 'Vegan', 'Vegetarian', 'Beef', 'Chicken', 'Veg', 'Egg', 'Combo', 'drinks'];

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

export default function AddFood() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [restaurantId, setRestaurantId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', imageUrl: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const ownerId = user.id || user.userId;
    if (!ownerId) { setError('Not logged in.'); return; }
    fetch(`${API}/restaurants/owner/${ownerId}`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        if (arr.length === 0) throw new Error('No restaurant linked to account.');
        setRestaurantId(arr[0].id || arr[0].restaurantId);
      })
      .catch(e => setError(e.message));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setForm({ ...form, imageUrl: url });
    setImagePreview(url);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch(`${API}/upload/image`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(prev => ({ ...prev, imageUrl: data.url }));
      setImagePreview(data.url);
    } catch (err) { setError('Upload failed: ' + err.message); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name || !form.price || !form.category) { setError('Name, price and category are required.'); return; }
    if (!restaurantId) { setError('Restaurant not found.'); return; }
    setSaving(true);
    try {
      const body = { name: form.name, description: form.description, price: parseFloat(form.price), category: form.category, imageUrl: form.imageUrl || null, available: true };
      const res = await fetch(`${API}/food/restaurant/${restaurantId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add item');
      setSuccess('Food item added successfully!');
      setForm({ name: '', description: '', price: '', category: '', imageUrl: '' });
      setImagePreview('');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
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
              <h1 className="text-xl font-bold text-gray-900">Add Food Item</h1>
            </div>
            <Link to="/restaurant/food-list" className="text-emerald-500 hover:text-emerald-600 font-medium">← Back to Menu</Link>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
            {success && <div className="mb-4 rounded-xl bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm flex justify-between items-center">
              {success}
              <Link to="/restaurant/food-list" className="ml-4 underline text-green-800 font-medium">View menu →</Link>
            </div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name <span className="text-red-500">*</span></label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Chicken Biryani"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the dish..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) <span className="text-red-500">*</span></label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 focus:bg-white transition"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Food Image</label>
                {imagePreview && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 h-48 bg-gray-100">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" onError={() => setImagePreview('')} />
                  </div>
                )}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition" onClick={() => fileInputRef.current?.click()}>
                  {uploading ? (
                    <div className="flex items-center justify-center gap-3 text-emerald-500">
                      <Upload size={24} />
                      <span className="text-sm font-medium">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-1">Click to upload image</p>
                      <p className="text-xs text-gray-400">JPG, PNG up to 10MB</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">OR</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="Paste image URL here"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-gray-50 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={saving || uploading}
                className="w-full mt-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Adding Item...' : 'Add Food Item'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

