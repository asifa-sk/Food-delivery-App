import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Receipt, Sparkles, Star, Users } from 'lucide-react';
import apiClient from '../../api/apiClient';

export default function Customers() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    const ownerId = user.id || user.userId;
    if (!ownerId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const restaurantRes = await apiClient.get(`/restaurants/owner/${ownerId}`);
        const linkedRestaurant = Array.isArray(restaurantRes.data) && restaurantRes.data.length ? restaurantRes.data[0] : null;
        setRestaurant(linkedRestaurant);
        if (!linkedRestaurant) return;

        const rid = linkedRestaurant.id || linkedRestaurant.restaurantId;
        const [ordersRes, reviewsRes] = await Promise.all([
          apiClient.get(`/orders/restaurant/${rid}`),
          apiClient.get(`/reviews/restaurant/${rid}`),
        ]);

        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const reviews = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];

        const reviewCountByCustomer = reviews.reduce((acc, review) => {
          const key = String(review.customerId || '');
          if (!key) return acc;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const customerMap = new Map();
        orders.forEach((order) => {
          const customer = order.customer || {};
          const key = String(customer.id || order.customerId || '');
          if (!key) return;

          const existing = customerMap.get(key) || {
            id: key,
            name: customer.name || order.customerName || 'Customer',
            email: customer.email || order.customerEmail || '',
            totalOrders: 0,
            totalSpent: 0,
            lastOrderAt: null,
            deliveredOrders: 0,
          };

          existing.totalOrders += 1;
          existing.totalSpent += Number(order.totalPrice || 0);
          if (order.status === 'DELIVERED') existing.deliveredOrders += 1;
          if (!existing.lastOrderAt || new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
            existing.lastOrderAt = order.createdAt;
          }
          customerMap.set(key, existing);
        });

        const enrichedCustomers = Array.from(customerMap.values())
          .map((customer) => ({
            ...customer,
            reviewCount: reviewCountByCustomer[String(customer.id)] || 0,
          }))
          .sort((a, b) => b.totalOrders - a.totalOrders || b.totalSpent - a.totalSpent);

        setCustomers(enrichedCustomers);
      } catch {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = useMemo(() => {
    const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const repeatCustomers = customers.filter((customer) => customer.totalOrders > 1).length;
    const totalReviews = customers.reduce((sum, customer) => sum + customer.reviewCount, 0);
    return { totalRevenue, repeatCustomers, totalReviews };
  }, [customers]);

  if (loading) return <div className="p-6 text-gray-500">Loading customers...</div>;
  if (!restaurant) return <div className="p-6">No restaurant linked to your account.</div>;

  return (
    <div className="min-h-screen bg-[#fffaf6] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-amber-100 shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr] md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">Customer insights</p>
              <h1 className="mt-3 text-3xl font-black text-gray-900 md:text-4xl">{restaurant.name}</h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
                See your most loyal guests, review activity, and spending trends in one polished view.
              </p>
              <button
                onClick={() => navigate('/restaurant/dashboard')}
                className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to dashboard
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              {[
                { label: 'Active customers', value: customers.length, icon: Users, tone: 'text-slate-900' },
                { label: 'Repeat customers', value: summary.repeatCustomers, icon: Sparkles, tone: 'text-orange-600' },
                { label: 'Review actions', value: summary.totalReviews, icon: Star, tone: 'text-amber-500' },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-orange-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">{card.label}</p>
                      <Icon size={18} className={card.tone} />
                    </div>
                    <p className={`mt-4 text-3xl font-black ${card.tone}`}>{card.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.4fr]">
          <div className="rounded-[2rem] border border-orange-100 bg-slate-900 p-6 text-white shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-200">Revenue snapshot</p>
            <p className="mt-4 text-4xl font-black">₹{summary.totalRevenue.toFixed(0)}</p>
            <p className="mt-2 text-sm text-white/70">Lifetime customer spend captured from your dashboard orders.</p>

            <div className="mt-8 space-y-4">
              {customers.slice(0, 3).map((customer, index) => (
                <div key={customer.id} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">Top guest #{index + 1}</p>
                      <h3 className="mt-2 text-lg font-bold">{customer.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.15em] text-white/60">Spend</p>
                      <p className="mt-1 text-xl font-black text-orange-200">₹{customer.totalSpent.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Customer directory</h2>
              <p className="text-sm text-gray-500">A cleaner operational view of who is ordering and engaging most.</p>
            </div>

            {customers.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-orange-200 bg-orange-50/70 p-10 text-center text-sm text-gray-500">
                No customers found yet.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {customers.map((customer) => (
                  <div key={customer.id} className="rounded-3xl border border-gray-100 bg-gradient-to-r from-white to-orange-50/40 p-5 transition hover:shadow-md">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                            {(customer.name || 'C').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-bold text-gray-900">{customer.name || 'Customer'}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                              <Mail size={14} />
                              <span className="truncate">{customer.email || 'Email not available'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {[
                          { label: 'Orders', value: customer.totalOrders, icon: Receipt },
                          { label: 'Delivered', value: customer.deliveredOrders, icon: Sparkles },
                          { label: 'Reviews', value: customer.reviewCount, icon: Star },
                          { label: 'Spent', value: `₹${customer.totalSpent.toFixed(0)}`, icon: Users },
                        ].map((stat) => {
                          const Icon = stat.icon;
                          return (
                            <div key={stat.label} className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-orange-100">
                              <Icon size={15} className="mx-auto text-orange-500" />
                              <p className="mt-2 text-lg font-black text-gray-900">{stat.value}</p>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">{stat.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-orange-100 pt-4 text-sm text-gray-500">
                      <span>
                        Last order:{' '}
                        <span className="font-semibold text-gray-800">
                          {customer.lastOrderAt
                            ? new Date(customer.lastOrderAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                            : 'N/A'}
                        </span>
                      </span>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-orange-600">
                        {customer.totalOrders > 1 ? 'Repeat customer' : 'New customer'}
                      </span>
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
