import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Save, Upload } from 'lucide-react';
import RestaurantShell from '../../components/restaurant/RestaurantShell';
import { readStoredJson } from '../../utils/storage';

const API = 'http://localhost:8081/api';

const CATEGORIES = ['Appetizers', 'Starters', 'Main Course', 'Curry', 'Desserts', 'Beverages', 'Side Dish', 'Sides', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pizza', 'Burgers', 'Sandwiches', 'Salads', 'Soups', 'Seafood', 'Vegan', 'Vegetarian', 'Beef', 'Chicken', 'Veg', 'Egg', 'Combo', 'drinks'];

export default function AddFood() {
  const fileInputRef = useRef(null);
  const user = readStoredJson('user', {});
  const [restaurantId, setRestaurantId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', imageUrl: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRestaurant = useCallback(() => {
    const ownerId = user.id || user.userId;
    if (!ownerId) { setError('Not logged in.'); return; }
    fetch(`${API}/restaurants/owner/${ownerId}`)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        if (arr.length === 0) throw new Error('No restaurant linked to account.');
        setRestaurantId(arr[0].id || arr[0].restaurantId);
      })
      .catch((e) => setError(e.message));
  }, [user.id, user.userId]);

  useEffect(() => {
    loadRestaurant();
  }, [loadRestaurant]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setForm({ ...form, imageUrl: url });
    setImagePreview(url);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/upload/image`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
      setImagePreview(data.url);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <RestaurantShell
      title="Add Food Item"
      eyebrow="Menu creation"
      subtitle="Introduce new dishes with a cleaner publishing flow that matches the rest of your workspace."
      actions={
        <Link to="/restaurant/food-list" className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-100">
          Back to menu
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-4xl">
        <div className="panel-surface p-6 md:p-8">
          {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
          {success ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <span>{success}</span>
              <Link to="/restaurant/food-list" className="font-semibold underline">
                View menu
              </Link>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Item Name <span className="text-red-500">*</span></label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g., Chicken Biryani"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the dish..."
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Price (Rs.) <span className="text-red-500">*</span></label>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Category <span className="text-red-500">*</span></label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
                <label className="mb-3 block text-sm font-semibold text-slate-700">Food Image</label>
                {imagePreview ? (
                  <div className="mb-4 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
                    <img src={imagePreview} alt="Preview" className="h-56 w-full object-cover" onError={() => setImagePreview('')} />
                  </div>
                ) : (
                  <div className="mb-4 flex h-56 items-center justify-center rounded-[24px] border border-dashed border-brand-200 bg-white text-sm text-slate-400">
                    Preview will appear here
                  </div>
                )}
                <div
                  className="cursor-pointer rounded-[24px] border-2 border-dashed border-brand-200 bg-white p-6 text-center transition hover:border-brand-300 hover:bg-brand-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-3 text-brand-500">
                      <Upload size={22} />
                      <span className="text-sm font-semibold">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={28} className="mx-auto mb-2 text-brand-400" />
                      <p className="text-sm font-semibold text-slate-700">Click to upload image</p>
                      <p className="mt-1 text-xs text-slate-400">JPG, PNG up to 10MB</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-brand-100" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">or</span>
                  <div className="h-px flex-1 bg-brand-100" />
                </div>
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="Paste image URL here"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? 'Adding item...' : 'Add food item'}
            </button>
          </form>
        </div>
      </div>
    </RestaurantShell>
  );
}
