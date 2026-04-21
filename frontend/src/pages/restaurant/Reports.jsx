import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8081/api';

export default function Reports() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    const ownerId = user.id || user.userId;
    if (!ownerId) { setLoading(false); return; }
    fetch(`${API}/restaurants/owner/${ownerId}`)
      .then(r => r.json())
      .then(arr => {
        const r = Array.isArray(arr) && arr.length ? arr[0] : null;
        if (!r) return setRestaurant(null);
        setRestaurant(r);
        const rid = r.id || r.restaurantId;
        fetch(`${API}/orders/restaurant/${rid}`).then(res => res.json()).then(data => {
          setOrders(Array.isArray(data) ? data : []);
        }).catch(() => {});
      }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading reports…</div>;
  if (!restaurant) return <div className="p-6">No restaurant linked to your account.</div>;

  const total = orders.reduce((s, o) => s + Number(o.totalPrice ?? 0), 0);
  const byStatus = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});

  return (
    <div className="min-h-screen bg-[#fffaf6] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-amber-100 shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr] md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">Business reports</p>
              <h1 className="mt-3 text-3xl font-black text-gray-900 md:text-4xl">{restaurant.name}</h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 md:text-base">A concise overview of orders, revenue and active items for your restaurant.</p>
              <button onClick={() => navigate('/restaurant/dashboard')} className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Back to dashboard</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-orange-100">
                <div className="flex items-center justify-between"><div className="text-sm text-gray-500">Total Revenue</div></div>
                <p className="mt-4 text-3xl font-black text-slate-900">₹{total.toFixed(2)}</p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-orange-100">
                <div className="flex items-center justify-between"><div className="text-sm text-gray-500">Total Orders</div></div>
                <p className="mt-4 text-3xl font-black text-slate-900">{orders.length}</p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-orange-100">
                <div className="flex items-center justify-between"><div className="text-sm text-gray-500">Active Orders</div></div>
                <p className="mt-4 text-3xl font-black text-slate-900">{orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-3 text-lg">Orders by status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(byStatus).map(([k,v]) => (
                <div key={k} className="p-3 rounded bg-gray-50"> <div className="text-xs text-gray-500">{k}</div><div className="font-bold text-lg">{v}</div></div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-3 text-lg">Recent orders</h3>
            {orders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/70 p-8 text-center text-sm text-gray-500">No orders yet.</div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 6).map((o) => (
                  <div key={o.id} className="rounded-2xl border border-gray-100 p-4 bg-gradient-to-r from-white to-orange-50/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">Order #{o.id}</div>
                        <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₹{Number(o.totalPrice ?? 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">{o.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
