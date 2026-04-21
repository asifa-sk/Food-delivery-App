import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Clock,
  MessageSquare,
  Package,
  RefreshCw,
  Star,
  Truck,
} from "lucide-react";
import NavbarWithCart from "../components/common/NavbarWithCart";
import CartSidebar from "../components/common/CartSidebar";
import { useAuth } from "../hooks/useAuth";
import {
  fetchCustomerOrders,
  fetchCustomerReviews,
  submitFoodItemReview,
} from "../api/orderApi";

const parseCustomerIdFromToken = (token) => {
  if (!token || typeof token !== "string") return null;
  const parts = token.split("-");
  if (parts.length < 4) return null;
  const maybeId = Number(parts[2]);
  return Number.isFinite(maybeId) ? maybeId : null;
};

const STATUS_CONFIG = {
  PENDING: { label: "Placed", color: "text-blue-600 bg-blue-50", icon: <Clock size={14} />, step: 1 },
  CONFIRMED: { label: "Confirmed", color: "text-indigo-600 bg-indigo-50", icon: <CheckCircle size={14} />, step: 2 },
  PREPARING: { label: "Preparing", color: "text-yellow-700 bg-yellow-50", icon: <AlertCircle size={14} />, step: 3 },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "text-orange-600 bg-orange-50", icon: <Truck size={14} />, step: 4 },
  DELIVERED: { label: "Delivered", color: "text-green-700 bg-green-50", icon: <CheckCircle size={14} />, step: 5 },
  CANCELLED: { label: "Cancelled", color: "text-red-600 bg-red-50", icon: <AlertCircle size={14} />, step: 0 },
};

const ORDER_STEPS = ["Placed", "Confirmed", "Preparing", "Out for Delivery", "Delivered"];

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reviewsByOrderItem, setReviewsByOrderItem] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [savingReviewId, setSavingReviewId] = useState(null);

  const customerId = user?.id || parseCustomerIdFromToken(localStorage.getItem("token"));

  const loadOrders = async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetchCustomerOrders(customerId);
      const raw = Array.isArray(res.data) ? res.data : [];
      setOrders(
        raw.map((order) => ({
          id: order.id,
          displayId: `FO-${order.id}`,
          restaurant: order.restaurant?.name || order.restaurantName || "Restaurant",
          status: order.status,
          amount: order.totalPrice ?? 0,
          createdAt: order.createdAt,
          address: order.deliveryAddress || "Address not available",
          items: order.orderItems || [],
        }))
      );
    } catch {
      setError("Could not load orders. Make sure you are connected to the server.");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!customerId) return;

    try {
      const res = await fetchCustomerReviews(customerId);
      const reviews = Array.isArray(res.data) ? res.data : [];
      const reviewMap = reviews.reduce((acc, review) => {
        acc[review.orderItemId] = review;
        return acc;
      }, {});

      setReviewsByOrderItem(reviewMap);
      setReviewDrafts((prev) => {
        const next = { ...prev };
        reviews.forEach((review) => {
          next[review.orderItemId] = {
            rating: review.rating || 5,
            comment: review.comment || "",
          };
        });
        return next;
      });
    } catch {
      // keep page functional even if reviews are not reachable
    }
  };

  useEffect(() => {
    loadOrders();
    loadReviews();
  }, [customerId]);

  const deliveredOrdersCount = useMemo(
    () => orders.filter((order) => order.status === "DELIVERED").length,
    [orders]
  );

  const toggleExpand = (id) => setExpandedOrderId((prev) => (prev === id ? null : id));

  const setDraftField = (orderItemId, field, value) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [orderItemId]: {
        rating: prev[orderItemId]?.rating || 5,
        comment: prev[orderItemId]?.comment || "",
        [field]: value,
      },
    }));
  };

  const handleReviewSubmit = async (order, item) => {
    const orderItemId = item.id;
    const draft = reviewDrafts[orderItemId] || { rating: 5, comment: "" };
    setSavingReviewId(orderItemId);
    setError("");

    try {
      const res = await submitFoodItemReview({
        customerId,
        orderId: order.id,
        orderItemId,
        foodItemId: item.foodItem?.id,
        rating: Number(draft.rating || 5),
        comment: draft.comment || "",
      });
      const saved = res.data;
      setReviewsByOrderItem((prev) => ({ ...prev, [orderItemId]: saved }));
      setReviewDrafts((prev) => ({
        ...prev,
        [orderItemId]: {
          rating: saved.rating || 5,
          comment: saved.comment || "",
        },
      }));
      localStorage.setItem("restaurantReviewUpdatedAt", String(Date.now()));
    } catch (reviewError) {
      setError(
        reviewError?.response?.data?.message ||
        reviewError?.response?.data ||
        "Could not save your review. Please try again."
      );
    } finally {
      setSavingReviewId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-rose-50 shadow-sm">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="rounded-2xl bg-white p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-100">
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-black text-gray-900 md:text-3xl">Your orders</h1>
                <p className="mt-1 text-sm text-gray-500">Track every order and review delivered dishes from one place.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Delivered</p>
                <p className="mt-1 text-xl font-black text-gray-900">{deliveredOrdersCount}</p>
              </div>
              <button onClick={loadOrders} className="rounded-2xl bg-orange-500 p-3 text-white transition hover:bg-orange-600" title="Refresh">
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="py-20 text-center">
            <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-5 rounded-3xl border border-red-200 bg-red-50 p-5 text-center">
            <AlertCircle className="mx-auto mb-2 text-red-500" size={28} />
            <p className="font-semibold text-red-700">{error}</p>
            <button onClick={loadOrders} className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600">
              Retry
            </button>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="py-24 text-center">
            <Package className="mx-auto mb-4 text-gray-300" size={64} />
            <p className="text-xl font-bold text-gray-700">No orders yet</p>
            <p className="mt-1 text-gray-500">Explore restaurants and place your first order.</p>
            <button onClick={() => navigate("/")} className="mt-5 rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600">
              Browse Restaurants
            </button>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-5">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const isExpanded = expandedOrderId === order.id;

              return (
                <div key={order.id} className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-start gap-4 p-5 md:p-6">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-sm font-black text-orange-600">
                      FO
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{order.restaurant}</h3>
                          <p className="mt-1 text-sm text-gray-500">Order {order.displayId}</p>
                          {order.createdAt && (
                            <p className="mt-1 text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <p className="mt-3 text-lg font-black text-gray-900">₹{Number(order.amount).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.status !== "CANCELLED" && (
                    <div className="px-5 pb-4 md:px-6">
                      <div className="flex items-center gap-1">
                        {ORDER_STEPS.map((step, idx) => {
                          const filled = cfg.step > idx;
                          const current = cfg.step === idx + 1;
                          return (
                            <div key={step} className="flex flex-1 flex-col items-center gap-1">
                              <div className={`h-1.5 w-full rounded-full transition-all ${filled || current ? "bg-orange-500" : "bg-gray-200"}`} />
                              <span className={`text-center text-[9px] font-semibold leading-tight ${current ? "text-orange-500" : filled ? "text-green-600" : "text-gray-400"}`}>
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 md:px-6">
                    <span className="text-sm text-gray-500">{order.items.length} {order.items.length === 1 ? "item" : "items"} in this order</span>
                    <button onClick={() => toggleExpand(order.id)} className="flex items-center gap-1 text-sm font-semibold text-orange-500 hover:underline">
                      {isExpanded ? "Hide details" : "View details"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white px-5 pb-5 md:px-6">
                      <div className="space-y-4 pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Delivery address</p>
                            <p className="mt-2 text-sm font-medium text-gray-800">{order.address}</p>
                          </div>
                          <div className="rounded-2xl bg-orange-50 px-4 py-3 text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Order amount</p>
                            <p className="mt-1 text-lg font-black text-orange-600">₹{Number(order.amount).toFixed(2)}</p>
                          </div>
                        </div>

                        {order.items.length > 0 && (
                          <div className="space-y-3">
                            {order.items.map((item) => {
                              const existingReview = reviewsByOrderItem[item.id];
                              const draft = reviewDrafts[item.id] || {
                                rating: existingReview?.rating || 5,
                                comment: existingReview?.comment || "",
                              };

                              return (
                                <div key={item.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                      <h4 className="text-base font-bold text-gray-900">{item.foodItem?.name || "Item"}</h4>
                                      <p className="mt-1 text-sm text-gray-500">
                                        Quantity {item.quantity} | ₹{Number(item.unitPrice ?? item.foodItem?.price ?? 0).toFixed(2)}
                                      </p>
                                    </div>

                                    {order.status === "DELIVERED" ? (
                                      <div className="w-full max-w-xl rounded-3xl bg-amber-50/70 p-4 ring-1 ring-amber-100">
                                        <div className="flex items-center gap-2">
                                          <MessageSquare size={16} className="text-amber-600" />
                                          <p className="text-sm font-semibold text-gray-800">
                                            {existingReview ? "Update your dish review" : "Rate this dish"}
                                          </p>
                                        </div>

                                        <div className="mt-3 flex items-center gap-2">
                                          {[1, 2, 3, 4, 5].map((starValue) => (
                                            <button
                                              key={starValue}
                                              type="button"
                                              onClick={() => setDraftField(item.id, "rating", starValue)}
                                              className="transition hover:scale-110"
                                            >
                                              <Star
                                                size={18}
                                                className={starValue <= Number(draft.rating || 0) ? "fill-amber-400 text-amber-500" : "text-gray-300"}
                                              />
                                            </button>
                                          ))}
                                          <span className="ml-1 text-xs font-semibold uppercase tracking-[0.15em] text-amber-700">
                                            {draft.rating || 5}/5
                                          </span>
                                        </div>

                                        <textarea
                                          value={draft.comment}
                                          onChange={(event) => setDraftField(item.id, "comment", event.target.value)}
                                          rows={3}
                                          placeholder="Share what you liked about this item..."
                                          className="mt-3 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                                        />

                                        <div className="mt-3 flex items-center justify-between gap-3">
                                          <p className="text-xs text-gray-500">
                                            {existingReview ? "Your restaurant dashboard view will refresh with the latest item review." : "One review is saved per delivered order item."}
                                          </p>
                                          <button
                                            type="button"
                                            onClick={() => handleReviewSubmit(order, item)}
                                            disabled={savingReviewId === item.id}
                                            className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {savingReviewId === item.id ? "Saving..." : existingReview ? "Update review" : "Submit review"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                                        Reviews unlock once the order is delivered.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
