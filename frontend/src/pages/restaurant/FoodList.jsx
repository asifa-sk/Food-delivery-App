import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import RestaurantShell from '../../components/restaurant/RestaurantShell';
import { readStoredJson } from '../../utils/storage';

const API = 'http://localhost:8081/api';
const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23f8fafc"/><text x="50%25" y="52%25" font-size="16" text-anchor="middle" fill="%23647589">Food Image</text></svg>';

export default function RestaurantFoodList() {
  const user = readStoredJson('user', {});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [savingPrice, setSavingPrice] = useState(null);
  const [draftPrices, setDraftPrices] = useState({});
  const [search, setSearch] = useState('');

  const loadItems = useCallback(() => {
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
  }, [user.id, user.userId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    setDraftPrices(
      items.reduce((acc, item) => {
        acc[item.id] = Number(item.price || 0).toFixed(2);
        return acc;
      }, {})
    );
  }, [items]);

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

  const handlePriceSave = async (item) => {
    const nextPrice = Number(draftPrices[item.id]);
    if (Number.isNaN(nextPrice) || nextPrice < 0) {
      setError('Enter a valid price before saving.');
      return;
    }

    setSavingPrice(item.id);
    setError('');
    try {
      const response = await fetch(`${API}/food/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          price: nextPrice,
          category: item.category,
          imageUrl: item.imageUrl || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update price');
      }

      setItems((prev) => prev.map((current) => (current.id === item.id ? data : current)));
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingPrice(null);
    }
  };

  return (
    <RestaurantShell
      title="Menu Management"
      eyebrow="Catalog control"
      subtitle="Refine dish presentation, availability and menu quality from one polished inventory view."
      actions={
        <>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 pl-9 text-sm text-slate-700 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <Link to="/restaurant/add-food" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            <Plus size={16} />
            Add item
          </Link>
        </>
      }
    >
      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

      {loading ? (
        <div className="panel-surface py-20 text-center text-slate-500">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          Loading menu...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="panel-surface py-20 text-center">
          <p className="text-2xl font-black tracking-tight text-slate-950">No menu items found</p>
          <p className="mt-2 text-sm text-slate-500">Add your first dish to get started.</p>
          <Link to="/restaurant/add-food" className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            <Plus size={16} />
            Add food item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredItems.map((item) => {
            const imageSrc = item.imageUrl?.trim() ? item.imageUrl : PLACEHOLDER;
            return (
              <div key={item.id} className="panel-surface overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="relative h-52 bg-slate-100 lg:h-auto lg:w-64 lg:flex-shrink-0">
                    <img
                      src={imageSrc}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER;
                      }}
                    />
                    <div className="absolute left-4 top-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.category || 'Uncategorized'}</p>
                        <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{item.name}</h3>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">{item.description || 'No description added yet.'}</p>
                      </div>
                      <div className="rounded-[24px] bg-slate-950 px-5 py-4 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Price</p>
                        <p className="mt-2 text-3xl font-black">Rs. {Number(item.price || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-[24px] border border-brand-100 bg-brand-50/70 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Update customer price
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={draftPrices[item.id] ?? ''}
                            onChange={(event) => setDraftPrices((prev) => ({ ...prev, [item.id]: event.target.value }))}
                            className="w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
                          />
                        </div>
                        <button
                          onClick={() => handlePriceSave(item)}
                          disabled={savingPrice === item.id}
                          className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingPrice === item.id ? 'Saving...' : 'Save price'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
    </RestaurantShell>
  );
}
