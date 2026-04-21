import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  MessageSquare,
  Star,
  TrendingUp,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import apiClient from '../../api/apiClient';

const renderStars = (rating) =>
  Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      size={14}
      className={index < Math.round(Number(rating || 0)) ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}
    />
  ));

const formatReviewTime = (value) => {
  if (!value) return 'Just now';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function Reviews() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    const ownerId = user.id || user.userId;
    if (!ownerId) {
      setLoading(false);
      return;
    }

    let active = true;

    const load = async ({ silent = false } = {}) => {
      if (!silent && active) {
        setLoading(true);
      }

      try {
        const restaurantRes = await apiClient.get(`/restaurants/owner/${ownerId}`);
        const linkedRestaurant = Array.isArray(restaurantRes.data) && restaurantRes.data.length ? restaurantRes.data[0] : null;
        if (!active) return;

        setRestaurant(linkedRestaurant);
        if (!linkedRestaurant) return;

        const rid = linkedRestaurant.id || linkedRestaurant.restaurantId;
        const reviewRes = await apiClient.get(`/restaurants/${rid}/reviews`);
        if (!active) return;

        const nextReviews = Array.isArray(reviewRes.data) ? reviewRes.data : [];
        nextReviews.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime()
        );
        setReviews(nextReviews);
      } catch {
        if (active) {
          setReviews([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    const refreshSilently = () => load({ silent: true });
    const intervalId = window.setInterval(refreshSilently, 15000);

    const handleFocus = () => refreshSilently();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSilently();
      }
    };
    const handleStorage = (event) => {
      if (event.key === 'restaurantReviewUpdatedAt') {
        refreshSilently();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const averageRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    return (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const topItems = useMemo(() => {
    const grouped = reviews.reduce((acc, review) => {
      const key = review.foodItemId || review.foodItemName;
      if (!acc[key]) {
        acc[key] = {
          foodItemName: review.foodItemName || 'Menu item',
          totalRating: 0,
          totalReviews: 0,
        };
      }
      acc[key].totalRating += Number(review.rating || 0);
      acc[key].totalReviews += 1;
      return acc;
    }, {});

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        averageRating: item.totalReviews ? (item.totalRating / item.totalReviews).toFixed(1) : '0.0',
      }))
      .sort((a, b) => Number(b.averageRating) - Number(a.averageRating) || b.totalReviews - a.totalReviews)
      .slice(0, 4);
  }, [reviews]);

  const customerActions = useMemo(() => {
    const uniqueCustomers = new Set(reviews.map((review) => review.customerId).filter(Boolean)).size;
    const withComments = reviews.filter((review) => review.comment).length;
    const lastActionTime = reviews.length ? formatReviewTime(reviews[0]?.createdAt) : 'No activity yet';

    return {
      uniqueCustomers,
      withComments,
      lastActionTime,
      reviewedDishes: new Set(reviews.map((review) => review.foodItemId).filter(Boolean)).size,
    };
  }, [reviews]);

  if (loading) return <div className="p-6 text-slate-500">Loading reviews...</div>;
  if (!restaurant) return <div className="p-6">No restaurant linked to your account.</div>;

  return (
    <div className="min-h-screen bg-[#fffaf6] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-[#171717] via-[#1f1f1f] to-[#e35d2f] text-white shadow-[0_24px_80px_rgba(227,93,47,0.18)]">
          <div className="grid gap-6 p-6 md:grid-cols-[1.55fr_1fr] md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">Review Command Center</p>
              <h1 className="mt-4 text-3xl font-black md:text-5xl">{restaurant.name}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-orange-50/85 md:text-base">
                This section updates directly from customer review actions in the order flow, so you can track dish sentiment, comments, and review momentum in real time.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/restaurant/dashboard')}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-orange-50"
                >
                  Back to dashboard
                </button>
                <div className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white/90">
                  {reviews.length} order-based customer reviews
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">Latest customer action</p>
                  <p className="mt-3 text-lg font-black text-white">{customerActions.lastActionTime}</p>
                  <p className="mt-2 text-sm text-orange-100/80">Most recent review added or updated from the customer orders page.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">Customer engagement</p>
                  <p className="mt-3 text-lg font-black text-white">{customerActions.uniqueCustomers} guests participated</p>
                  <p className="mt-2 text-sm text-orange-100/80">Unique customers who completed review actions on delivered orders.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              {[
                { label: 'Average rating', value: averageRating, suffix: '/5', icon: Star },
                { label: 'Written reviews', value: customerActions.withComments, suffix: '', icon: MessageSquare },
                { label: 'Reviewed dishes', value: customerActions.reviewedDishes, suffix: '', icon: UtensilsCrossed },
                { label: 'Live review feed', value: reviews.length, suffix: ' actions', icon: Zap },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-orange-100">{card.label}</p>
                      <Icon size={18} className="text-orange-200" />
                    </div>
                    <p className="mt-4 text-3xl font-black text-white">
                      {card.value}
                      <span className="ml-1 text-base font-semibold text-orange-100">{card.suffix}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.45fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-50 p-3 text-orange-500">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Top rated dishes</h2>
                  <p className="text-sm text-slate-500">Your most loved menu items based on customer review actions.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {topItems.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 p-8 text-center text-sm text-slate-500">
                    No item reviews yet.
                  </div>
                ) : (
                  topItems.map((item, index) => (
                    <div key={`${item.foodItemName}-${index}`} className="rounded-3xl bg-gradient-to-r from-orange-50 to-white p-5 ring-1 ring-orange-100">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Top dish #{index + 1}</p>
                          <h3 className="mt-2 text-lg font-black text-slate-900">{item.foodItemName}</h3>
                          <p className="mt-1 text-sm text-slate-500">{item.totalReviews} customer review actions</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Average</p>
                          <p className="mt-1 text-2xl font-black text-amber-500">{item.averageRating}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-orange-100 bg-slate-900 p-6 text-white shadow-lg">
              <h2 className="text-xl font-black">Review insights</h2>
              <div className="mt-6 space-y-4">
                {[
                  `Customers have submitted ${reviews.length} review action${reviews.length === 1 ? '' : 's'} from delivered orders.`,
                  `${customerActions.withComments} of those actions include written feedback you can act on.`,
                  `${customerActions.reviewedDishes} dishes now have direct customer sentiment attached to them.`,
                ].map((line) => (
                  <div key={line} className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm leading-7 text-white/85">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Latest customer review actions</h2>
                <p className="text-sm text-slate-500">Every submission or update from the customer order flow appears here.</p>
              </div>
              <div className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600">
                Auto-synced from customer dashboard
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-orange-200 bg-orange-50/60 p-10 text-center text-sm text-slate-500">
                Customers have not posted any dish reviews yet.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-3xl border border-slate-100 bg-gradient-to-r from-white to-orange-50/40 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-orange-600">
                            {review.foodItemName || 'Menu item'}
                          </span>
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">
                            {review.customerName || 'Customer action'}
                          </span>
                          <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                        </div>
                        <p className="mt-3 text-sm font-semibold text-slate-900">
                          {review.customerName || 'Customer'} reviewed this order item
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{formatReviewTime(review.createdAt)}</p>
                      </div>

                      <div className="rounded-2xl bg-slate-900 px-4 py-3 text-right text-white shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-200">Rating</p>
                        <p className="mt-1 text-2xl font-black">{review.rating}.0</p>
                      </div>
                    </div>

                    {review.comment ? (
                      <p className="mt-4 rounded-2xl bg-white/90 p-4 text-sm leading-7 text-slate-700 ring-1 ring-orange-100">
                        {review.comment}
                      </p>
                    ) : (
                      <p className="mt-4 text-sm italic text-slate-400">Customer completed a rating without a written comment.</p>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-orange-100 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Triggered from delivered order review action
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600">
                        Live entry
                        <ArrowUpRight size={15} />
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
