import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantLayout from '../../components/restaurant/RestaurantLayout';
import { useToast } from '../../components/common/Toast';

const API = 'http://localhost:8081/api';

export default function Settings() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', address: '', contactNumber: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ownerId = user.id || user.userId;
    if (!ownerId) { setLoading(false); return; }
    fetch(`${API}/restaurants/owner/${ownerId}`).then(r => r.json()).then(arr => {
      const r = Array.isArray(arr) && arr.length ? arr[0] : null;
      setRestaurant(r);
      if (r) setForm({ name: r.name || '', address: r.address || '', contactNumber: r.contactNumber || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!restaurant) return;
    setSaving(true);
    try {
      const rid = restaurant.id || restaurant.restaurantId;
      const res = await fetch(`${API}/restaurants/${rid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setRestaurant(data);
      showToast('Settings saved', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('Save failed', { type: 'error' });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading settings…</div>;
  if (!restaurant) return <div className="p-6">No restaurant linked to your account.</div>;

  return (
    <RestaurantLayout title="Restaurant settings" subtitle={restaurant.name} rightBadge="Auto-saved to dashboard">
      <section className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Details</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/restaurant/dashboard')} className="px-4 py-2 bg-white border text-sm rounded-md shadow-sm hover:shadow-md">Back to dashboard</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-500 text-white rounded-md shadow hover:bg-emerald-600 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact</label>
            <input value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
            <p className="text-xs text-gray-400 mt-2">Phone number visible to customers for delivery/contact.</p>
          </div>
        </div>
      </section>
    </RestaurantLayout>
  );
}
